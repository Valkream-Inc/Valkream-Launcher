/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Compilation rapide du process main en développement (esbuild, sans vérification de types).
 *
 * - même arborescence que `tsc` (`main/x.ts` -> `.tsbuild/x.js`) : les chemins relatifs
 *   basés sur `__dirname` (preload, renderer, package.json) restent valides ;
 * - recompile à chaque sauvegarde (quelques ms) ; Electron est relancé par nodemon ;
 * - détecte l'ajout / la suppression d'un fichier .ts et recrée alors le contexte.
 *
 * Les types sont vérifiés à part (`yarn dev:types:main`). Le build de production,
 * lui, utilise `tsc` (`yarn build:main`).
 */

import { context } from "esbuild";
import type { BuildContext } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const MAIN_DIR = "main";
const OUT_DIR = ".tsbuild";

const isSource = (file: string) =>
  file.endsWith(".ts") && !file.endsWith(".d.ts");

/** Tous les fichiers .ts (hors .d.ts) de `main/`. */
function collectEntries(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectEntries(entryPath);
    return isSource(entry.name) ? [entryPath] : [];
  });
}

async function createContext(entries: string[]): Promise<BuildContext> {
  const ctx = await context({
    entryPoints: entries,
    outdir: OUT_DIR,
    outbase: MAIN_DIR,
    platform: "node",
    format: "cjs",
    target: "node22",
    bundle: false,
    sourcemap: true,
    tsconfig: path.join(MAIN_DIR, "tsconfig.json"),
    logLevel: "warning",
    plugins: [
      {
        name: "dev-main-log",
        setup(build) {
          build.onStart(() => console.log("[dev-main] building..."));
          build.onEnd((result) =>
            console.log(
              result.errors.length
                ? `[dev-main] ${result.errors.length} erreur(s)`
                : "[dev-main] ready"
            )
          );
        },
      },
    ],
  });
  await ctx.watch();
  return ctx;
}

async function main(): Promise<void> {
  let entries = collectEntries(MAIN_DIR);
  let ctx = await createContext(entries);

  // Un nouveau fichier n'est pas vu par esbuild : on recrée le contexte si la liste change.
  let timer: NodeJS.Timeout | undefined;
  fs.watch(MAIN_DIR, { recursive: true }, (_event, filename) => {
    if (!filename || !isSource(filename.toString())) return;

    clearTimeout(timer);
    timer = setTimeout(async () => {
      const next = collectEntries(MAIN_DIR);
      const changed =
        next.length !== entries.length || next.some((f, i) => f !== entries[i]);
      if (!changed) return;

      entries = next;
      await ctx.dispose();
      ctx = await createContext(entries);
    }, 200);
  });

  const stop = async () => {
    await ctx.dispose();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((err: unknown) => {
  console.error("[dev-main] échec :", err);
  process.exit(1);
});
