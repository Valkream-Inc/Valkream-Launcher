/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * `thunderstore_modpack_url` : liste de dépendances `Auteur-Nom-Version`. Chaque mod
 * est extrait dans son propre dossier `<Auteur>-<Nom>` sous le dossier de l'entrée,
 * donc deux entrées partageant un même `path` (mods normaux et mods admin) ne
 * s'écrasent jamais. Les dossiers des mods retirés de la liste sont supprimés.
 * Option `dependencies` : résout aussi les dépendances transitives (manifest.json de chaque mod),
 * sauf celles listées dans `skip`. Sans elle, la liste doit être complète.
 */

import { createHash } from "crypto";
import fs from "fs";
import path from "path";

import { resolveInside } from "../../../lib/paths";
import { commitStaged } from "../staging";
import type { Provider, Uninstaller } from "./types";

const DEPENDENCY = /^([^-\s]+)-([^-\s]+)-([^\s]+)$/;

const parseDependency = (dependency: string) => {
  const match = DEPENDENCY.exec(dependency);
  if (!match) throw new Error(`Dépendance invalide : ${dependency}`);
  return { author: match[1], name: match[2], version: match[3], folder: `${match[1]}-${match[2]}` };
};

/** Dépendances déclarées dans le manifest.json d'un mod extrait (absent ou invalide : aucune). */
const readDependencies = (modDir: string) => {
  try {
    const raw = fs.readFileSync(path.join(modDir, "manifest.json"), "utf8").replace(/^\uFEFF/, "");
    const dependencies = (JSON.parse(raw) as { dependencies?: unknown }).dependencies;
    if (!Array.isArray(dependencies)) return [];
    return dependencies.flatMap((item) => {
      try {
        return [parseDependency(String(item))];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
};

export const thunderstoreProvider: Provider = async (context) => {
  const { entry, entryDir, tempDir, platform, resolver, io, name, signal, previousOwned, beforeCommit } = context;

  const content = entry.content;
  if (content === undefined || (typeof content === "object" && !Array.isArray(content))) {
    throw new Error(`${name} : liste de mods absente pour la plateforme ${platform}`);
  }
  const { value: list } = await resolver.getJson<string[]>(content as string | string[]);
  if (!Array.isArray(list)) throw new Error(`${name} : liste de mods invalide`);

  const apiUrl = (entry["api-url"] ?? "https://thunderstore.io").replace(/\/+$/, "");
  const mods = list.map(parseDependency);
  // Dépendances transitives (si `dependencies` est déclaré) : lues dans le manifest.json de chaque mod.
  const skip = new Set(entry.dependencies?.skip ?? []);
  const owned = mods.map((mod) => mod.folder);
  const queue = [...mods];

  // Chaque mod est extrait dans un dossier de préparation ; la bascule se fait une fois tout prêt.
  const stage = path.join(tempDir, `${name}.stage`);
  fs.rmSync(stage, { recursive: true, force: true });

  let done = 0;
  while (queue.length > 0) {
    const mod = queue.shift()!;
    context.report("download", `${mod.folder} ${mod.version} (${++done}/${done + queue.length})`);
    const zipPath = path.join(tempDir, `${mod.folder}.zip`);
    const url = resolver.urlOf(
      `${apiUrl}/package/download/${encodeURIComponent(mod.author)}/${encodeURIComponent(mod.name)}/${encodeURIComponent(mod.version)}/`,
    );
    await io.download(url, zipPath, signal, (transfer) =>
      context.report("download", `${mod.folder} ${mod.version} (${done}/${done + queue.length})`, transfer),
    );

    const staged = path.join(stage, mod.folder);
    context.report("extract", `Extraction de ${mod.folder}`);
    await io.extract(zipPath, staged, { accept: () => true });
    fs.rmSync(zipPath, { force: true });

    if (entry.dependencies) {
      for (const dependency of readDependencies(staged)) {
        if (skip.has(dependency.folder) || owned.includes(dependency.folder)) continue;
        owned.push(dependency.folder);
        queue.push(dependency);
      }
    }
  }

  // Tout est prêt : bascule. Dossier du mod remplacé en entier (version propre, pas de résidus),
  // puis retrait des mods disparus depuis la dernière installation de CETTE entrée.
  beforeCommit();
  for (const folder of owned) fs.rmSync(resolveInside(entryDir, folder), { recursive: true, force: true });
  commitStaged(stage, entryDir);
  for (const folder of previousOwned.filter((item) => !owned.includes(item))) {
    fs.rmSync(resolveInside(entryDir, folder), { recursive: true, force: true });
  }

  const hash = createHash("sha256").update([...list].sort().join("\n")).digest("hex");
  return { hash: entry.hash ?? hash, owned };
};

/** Retire les dossiers des mods installés par cette entrée (et eux seuls). */
export const thunderstoreUninstall: Uninstaller = async ({ entryDir, previousOwned }) => {
  for (const folder of previousOwned) {
    fs.rmSync(resolveInside(entryDir, folder), { recursive: true, force: true });
  }
};
