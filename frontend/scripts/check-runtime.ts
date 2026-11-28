/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Vérifie qu'un build (`yarn build`) S'EXÉCUTE, pas seulement qu'il existe : l'obfuscation peut produire
 * un JavaScript invalide ou casser un import sans qu'aucun fichier ne manque.
 *
 *   1. syntaxe      : `node --check` sur chaque fichier de `build/` (main obfusqué, preloads)
 *   2. imports      : chaque module est importé par un vrai processus Node (Electron simulé) ; aucune erreur
 *   3. comportement : le code obfusqué est appelé (traductions, chemins) et doit répondre juste
 *   4. Electron     : si le binaire Electron est présent (et un écran, ou xvfb), `electron build/app.js` démarre,
 *                     enregistre les handlers IPC et quitte avec le code 0 (`VALKREAM_SMOKE_TEST=1`)
 *
 *   yarn check:runtime [--no-electron]
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Fichiers JavaScript d'un dossier (récursif), triés. */
export const listJs = (dir: string): string[] => {
  const result: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...listJs(full));
    else if (/\.(js|cjs|mjs)$/.test(entry.name)) result.push(full);
  }
  return result.sort();
};

const firstLine = (text: string): string => text.trim().split("\n").find((line) => line.trim() !== "") ?? "";

/** 1. Syntaxe : `node --check` (rapide, n'exécute rien). */
export const checkSyntax = (buildDir: string): string[] => {
  const problems: string[] = [];
  for (const file of listJs(buildDir)) {
    const run = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (run.status !== 0) problems.push(`syntaxe invalide : ${path.relative(buildDir, file)} — ${firstLine(run.stderr)}`);
  }
  return problems;
};

// --- Electron simulé : permet d'importer les modules du main dans Node seul ---
const STUB_SOURCE = `
const handler = { get: (_t, key) => (key === "then" ? undefined : key === Symbol.toPrimitive ? () => "/stub" : key === "whenReady" ? () => new Promise(() => {}) : typeof key === "string" && key.startsWith("get") ? () => "/stub" : proxy()), apply: () => proxy(), construct: () => proxy() };
const proxy = () => new Proxy(function () {}, handler);
const stub = proxy();
export default stub;
export const app = stub, BrowserWindow = stub, ipcMain = stub, ipcRenderer = stub, dialog = stub, shell = stub,
  Menu = stub, contextBridge = stub, screen = stub, session = stub, Tray = stub, nativeImage = stub,
  safeStorage = stub, net = stub, protocol = stub, autoUpdater = stub;
`;

const HOOKS_SOURCE = `
const STUBS = new Set(["electron", "electron-updater"]);
export async function resolve(specifier, context, next) {
  if (STUBS.has(specifier)) return { url: "valkream-stub:" + specifier, shortCircuit: true };
  return next(specifier, context);
}
export async function load(url, context, next) {
  if (url.startsWith("valkream-stub:")) return { format: "module", source: ${JSON.stringify(STUB_SOURCE)}, shortCircuit: true };
  return next(url, context);
}
`;

const REGISTER_SOURCE = (hooksUrl: string) =>
  `import { register } from "node:module"; register(${JSON.stringify(hooksUrl)});`;

/** Modules qui démarrent l'application ou n'existent que dans Electron : vérifiés par la syntaxe (1) et le test Electron (4). */
const NOT_IMPORTED = [/^app\.js$/, /\.cjs$/];

const RUNNER_SOURCE = `
import path from "node:path";
import { pathToFileURL } from "node:url";
const [, , buildDir, ...files] = process.argv;
const failures = [];
for (const file of files) {
  try { await import(pathToFileURL(path.join(buildDir, file)).href); }
  catch (error) { failures.push(file + " — " + String(error && error.message ? error.message : error).split("\\n")[0]); }
}
process.stdout.write("\\n@@RESULT@@" + JSON.stringify(failures));
`;

const runNodeWithStubs = (buildDir: string, script: string, args: string[]): { status: number | null; stdout: string; stderr: string } => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "valkream-runtime-"));
  try {
    fs.writeFileSync(path.join(tmp, "hooks.mjs"), HOOKS_SOURCE);
    fs.writeFileSync(path.join(tmp, "register.mjs"), REGISTER_SOURCE(pathToFileURL(path.join(tmp, "hooks.mjs")).href));
    fs.writeFileSync(path.join(tmp, "run.mjs"), script);
    // `--import` veut une URL : un chemin « C:\… » est pris pour un protocole sous Windows
    // Le script est dans tmp : les dépendances (yaml…) se résolvent depuis le build, pas depuis tmp → NODE_PATH
    const nodeModules = path.resolve("node_modules");
    const run = spawnSync(process.execPath, ["--import", pathToFileURL(path.join(tmp, "register.mjs")).href, path.join(tmp, "run.mjs"), path.resolve(buildDir), ...args], {
      encoding: "utf8",
      env: { ...process.env, NODE_PATH: nodeModules },
      timeout: 120_000,
    });
    return { status: run.status, stdout: run.stdout ?? "", stderr: run.stderr ?? "" };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
};

const readResult = (stdout: string): string[] | undefined => {
  const marker = stdout.lastIndexOf("@@RESULT@@");
  if (marker < 0) return undefined;
  try {
    return JSON.parse(stdout.slice(marker + "@@RESULT@@".length)) as string[];
  } catch {
    return undefined;
  }
};

/** 2. Imports : chaque module du build se charge dans un vrai Node. */
export const checkImports = (buildDir: string): string[] => {
  const files = listJs(buildDir)
    .map((file) => path.relative(buildDir, file).replace(/\\/g, "/"))
    .filter((file) => !NOT_IMPORTED.some((pattern) => pattern.test(file)));
  const run = runNodeWithStubs(buildDir, RUNNER_SOURCE, files);
  const failures = readResult(run.stdout);
  if (!failures) return [`imports : le processus Node a échoué (code ${String(run.status)}) — ${firstLine(run.stderr)}`];
  return failures.map((failure) => `import impossible : ${failure}`);
};

const PROBE_SOURCE = `
import path from "node:path";
import { pathToFileURL } from "node:url";
const [, , buildDir] = process.argv;
const load = (file) => import(pathToFileURL(path.join(buildDir, file)).href);
const failures = [];
const expect = (label, ok) => { if (!ok) failures.push(label); };
try {
  const messages = await load("src/lib/errors/messages.js");
  expect("traduction fr", messages.translate("fr", "err.rootNotEmpty", { target: "X" }).includes("X"));
  expect("traduction en", messages.translate("en", "err.rootNotEmpty", { target: "X" }).includes("X"));
  expect("langues distinctes", messages.translate("fr", "err.rootNotEmpty", { target: "X" }) !== messages.translate("en", "err.rootNotEmpty", { target: "X" }));
} catch (error) { failures.push("messages : " + error.message); }
try {
  const paths = await load("src/lib/fs/paths.js");
  expect("isPathInside vrai", paths.isPathInside(path.resolve("/a"), path.resolve("/a/b")) === true);
  expect("isPathInside faux", paths.isPathInside(path.resolve("/a"), path.resolve("/b")) === false);
} catch (error) { failures.push("paths : " + error.message); }
process.stdout.write("\\n@@RESULT@@" + JSON.stringify(failures));
`;

/** 3. Comportement : le code obfusqué doit toujours répondre juste. */
export const checkBehavior = (buildDir: string): string[] => {
  const run = runNodeWithStubs(buildDir, PROBE_SOURCE, []);
  const failures = readResult(run.stdout);
  if (!failures) return [`comportement : le processus Node a échoué (code ${String(run.status)}) — ${firstLine(run.stderr)}`];
  return failures.map((failure) => `comportement incorrect : ${failure}`);
};

/** 4. Démarrage réel d'Electron (ignoré, avec la raison, si ce n'est pas possible ici). */
export const checkElectron = (buildDir: string): { problems: string[]; skipped?: string } => {
  const appFile = path.resolve(buildDir, "app.js");
  let electronBinary: string | undefined;
  try {
    const candidate = path.resolve("node_modules", "electron", "path.txt");
    const relative = fs.readFileSync(candidate, "utf8").trim();
    electronBinary = path.resolve("node_modules", "electron", "dist", relative);
    if (!fs.existsSync(electronBinary)) electronBinary = undefined;
  } catch {
    electronBinary = undefined;
  }
  if (!electronBinary) return { problems: [], skipped: "binaire Electron introuvable (yarn install)" };

  const needsDisplay = process.platform === "linux" && !process.env.DISPLAY;
  const xvfb = needsDisplay ? spawnSync("which", ["xvfb-run"], { encoding: "utf8" }).stdout.trim() : "";
  if (needsDisplay && !xvfb) return { problems: [], skipped: "pas d'écran (DISPLAY) ni xvfb-run" };

  const command = needsDisplay ? xvfb : electronBinary;
  const args = needsDisplay ? ["-a", electronBinary, "--no-sandbox", appFile] : [appFile];
  const run = spawnSync(command, args, {
    encoding: "utf8",
    timeout: 60_000,
    env: { ...process.env, VALKREAM_SMOKE_TEST: "1" },
  });
  const output = `${run.stdout}\n${run.stderr}`;
  if (run.status !== 0 || !output.includes("SMOKE_TEST_OK")) {
    return { problems: [`Electron : démarrage de ${path.basename(appFile)} en échec (code ${String(run.status)}) — ${firstLine(run.stderr || run.stdout)}`] };
  }
  return { problems: [] };
};

// --- Exécution en ligne de commande ---
const isMain = process.argv[1] !== undefined && path.resolve(process.argv[1]) === path.resolve(import.meta.filename);
if (isMain) {
  const buildDir = "build";
  if (!fs.existsSync(buildDir)) {
    console.error(`❌ Dossier "${buildDir}" introuvable : lance d'abord "yarn build".`);
    process.exit(1);
  }
  const problems = [...checkSyntax(buildDir), ...checkImports(buildDir), ...checkBehavior(buildDir)];
  if (!process.argv.includes("--no-electron")) {
    const electron = checkElectron(buildDir);
    problems.push(...electron.problems);
    if (electron.skipped) console.warn(`⚠️ Test de démarrage Electron ignoré : ${electron.skipped}`);
  }
  if (problems.length > 0) {
    console.error(`❌ Le build ne s'exécute pas correctement :\n- ${problems.join("\n- ")}`);
    process.exit(1);
  }
  console.log(`✅ Build exécutable : syntaxe, imports, comportement${process.argv.includes("--no-electron") ? "" : " (et démarrage Electron si disponible)"} OK.`);
}
