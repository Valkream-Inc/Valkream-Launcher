/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Vérifie qu'un build du launcher (`yarn build`) pourra se mettre à jour : `dist/latest.yml` (lu par
 * electron-updater sur le serveur) doit décrire exactement les fichiers produits (version, taille, sha512,
 * blockmap), l'installeur de mise à jour doit exister, et l'application embarquée (`build/`) doit contenir
 * ce que la fenêtre de mise à jour charge (preload, page, point d'entrée).
 *
 *   yarn check:build [--previous <version installée>]
 *
 * `--previous` : la version publiée doit être strictement supérieure (sinon aucun joueur ne se met à jour).
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { parse } from "yaml";

export interface CheckBuildOptions {
  /** Dossier des installeurs (`dist`). */
  distDir: string;
  /** Dossier de l'application embarquée (`build`) ; absent = non vérifié. */
  appDir?: string;
  /** `name` et `version` de package.json. */
  name: string;
  version: string;
  /** Version actuellement installée chez les joueurs : la nouvelle doit être supérieure. */
  previous?: string;
}

interface UpdateFile {
  url?: unknown;
  sha512?: unknown;
  size?: unknown;
}

const parseSemver = (version: string): { core: [number, number, number]; pre: string[] } | undefined => {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/.exec(version);
  return match
    ? { core: [Number(match[1]), Number(match[2]), Number(match[3])], pre: match[4] ? match[4].split(".") : [] }
    : undefined;
};

/** `a > b` en SemVer : majeure, mineure, correctif, puis pré-version (`3.0.0` > `3.0.0-beta.2` > `3.0.0-beta.1`). */
export const isNewerVersion = (a: string, b: string): boolean => {
  const left = parseSemver(a);
  const right = parseSemver(b);
  if (!left || !right) return false;
  for (let index = 0; index < 3; index++) {
    if (left.core[index] !== right.core[index]) return left.core[index] > right.core[index];
  }
  if (left.pre.length === 0 || right.pre.length === 0) return left.pre.length === 0 && right.pre.length > 0;
  for (let index = 0; index < Math.max(left.pre.length, right.pre.length); index++) {
    const x = left.pre[index];
    const y = right.pre[index];
    if (x === y) continue;
    if (x === undefined) return false;
    if (y === undefined) return true;
    const nx = /^\d+$/.test(x);
    const ny = /^\d+$/.test(y);
    if (nx && ny) return Number(x) > Number(y);
    if (nx !== ny) return ny;
    return x > y;
  }
  return false;
};

const sha512Base64 = (file: string): string => createHash("sha512").update(fs.readFileSync(file)).digest("base64");

/** Liste des problèmes (vide : la mise à jour fonctionnera). */
export const checkBuild = ({ distDir, appDir, name, version, previous }: CheckBuildOptions): string[] => {
  const problems: string[] = [];

  // --- latest.yml : ce que electron-updater lit sur le serveur ---
  const latestFile = path.join(distDir, "latest.yml");
  if (!fs.existsSync(latestFile)) return [`latest.yml introuvable dans ${distDir} (yarn build n'a pas abouti ?)`];

  let latest: { version?: unknown; path?: unknown; sha512?: unknown; releaseDate?: unknown; files?: UpdateFile[] };
  try {
    latest = parse(fs.readFileSync(latestFile, "utf8")) as typeof latest;
  } catch (error) {
    return [`latest.yml illisible : ${error instanceof Error ? error.message : String(error)}`];
  }

  if (latest.version !== version) problems.push(`latest.yml : version ${String(latest.version)} ≠ package.json ${version}`);
  if (previous !== undefined && !isNewerVersion(version, previous)) {
    problems.push(`version ${version} non supérieure à la version installée ${previous} : aucune mise à jour ne serait proposée`);
  }
  if (typeof latest.releaseDate !== "string" && !(latest.releaseDate instanceof Date) || Number.isNaN(Date.parse(String(latest.releaseDate)))) {
    problems.push("latest.yml : releaseDate absente ou invalide");
  }

  const files = Array.isArray(latest.files) ? latest.files : [];
  if (files.length === 0) problems.push("latest.yml : aucun fichier listé (files)");
  for (const [index, entry] of files.entries()) {
    const label = `latest.yml files[${index}]`;
    if (typeof entry.url !== "string" || typeof entry.sha512 !== "string" || typeof entry.size !== "number") {
      problems.push(`${label} : url, sha512 et size attendus`);
      continue;
    }
    const file = path.join(distDir, decodeURIComponent(entry.url));
    if (!fs.existsSync(file)) {
      problems.push(`${label} : ${entry.url} absent de ${distDir}`);
      continue;
    }
    if (fs.statSync(file).size !== entry.size) problems.push(`${label} : taille de ${entry.url} différente de latest.yml`);
    if (sha512Base64(file) !== entry.sha512) problems.push(`${label} : sha512 de ${entry.url} différent de latest.yml (le joueur refuserait le fichier)`);
  }

  // Le fichier visé par electron-updater est l'installeur de MISE À JOUR (silencieux), pas l'installeur complet
  if (typeof latest.path !== "string") problems.push("latest.yml : path absent");
  else {
    if (!latest.path.includes("-update-")) problems.push(`latest.yml : path ${latest.path} n'est pas l'installeur de mise à jour (${name}-update-…)`);
    if (!files.some((entry) => entry.url === latest.path)) problems.push("latest.yml : path ne figure pas dans files");
    if (files[0] && latest.sha512 !== files[0].sha512) problems.push("latest.yml : sha512 racine ≠ sha512 du premier fichier");
    // Mise à jour différentielle : le blockmap doit accompagner l'installeur
    if (!fs.existsSync(path.join(distDir, `${latest.path}.blockmap`))) problems.push(`blockmap manquant : ${latest.path}.blockmap`);
  }

  // Les deux installeurs existent (complet pour les nouveaux joueurs, mise à jour pour les autres)
  const installers = fs.readdirSync(distDir).filter((file) => file.endsWith(".exe") || file.endsWith(".AppImage") || file.endsWith(".dmg"));
  for (const kind of ["install", "update"]) {
    if (!installers.some((file) => file.startsWith(`${name}-${kind}-`))) problems.push(`installeur « ${kind} » absent de ${distDir}`);
  }

  // --- Application embarquée : ce que la fenêtre de mise à jour charge au démarrage ---
  if (appDir) {
    for (const required of ["app.js", "frontend/index.html", "src/windows/updatePreload.cjs", "src/windows/mainPreload.cjs"]) {
      if (!fs.existsSync(path.join(appDir, required))) problems.push(`application embarquée : ${path.join(appDir, required)} manquant`);
    }
  }
  return problems;
};

// --- Exécution en ligne de commande ---
const isMain = process.argv[1] !== undefined && path.resolve(process.argv[1]) === path.resolve(import.meta.filename);
if (isMain) {
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8")) as { name: string; version: string };
  const previousIndex = process.argv.indexOf("--previous");
  const problems = checkBuild({
    distDir: "dist",
    appDir: "build",
    name: pkg.name,
    version: pkg.version,
    previous: previousIndex >= 0 ? process.argv[previousIndex + 1] : undefined,
  });
  if (problems.length > 0) {
    console.error(`❌ Le système de mise à jour du build ${pkg.version} ne fonctionnera pas :\n- ${problems.join("\n- ")}`);
    process.exit(1);
  }
  console.log(`✅ Build ${pkg.version} : latest.yml, installeurs, blockmap et application embarquée cohérents.`);
}
