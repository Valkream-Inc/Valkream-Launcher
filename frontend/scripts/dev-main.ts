import type { BuildContext, BuildOptions } from "esbuild";
import { context } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const MAIN_DIR = "main";
const OUT_DIR = ".tsbuild";

const isEsmSource = (file: string) =>
  file.endsWith(".ts") && !file.endsWith(".d.ts");

const isCjsSource = (file: string) =>
  file.endsWith(".cts") && !file.endsWith(".d.cts");

const isSource = (file: string) => isEsmSource(file) || isCjsSource(file);

/** Tous les fichiers .ts et .cts (hors .d.ts / .d.cts) de `main/`. */
function collectEntries(dir: string): { esm: string[]; cjs: string[] } {
  const result = { esm: [] as string[], cjs: [] as string[] };

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = collectEntries(entryPath);
      result.esm.push(...sub.esm);
      result.cjs.push(...sub.cjs);
    } else if (isEsmSource(entry.name)) {
      result.esm.push(entryPath);
    } else if (isCjsSource(entry.name)) {
      result.cjs.push(entryPath);
    }
  }

  return result;
}

function sharedOptions(label: string): BuildOptions {
  return {
    outdir: OUT_DIR,
    outbase: MAIN_DIR,
    platform: "node",
    target: "node26",
    bundle: false,
    sourcemap: true,
    tsconfig: path.join(MAIN_DIR, "tsconfig.json"),
    logLevel: "warning",
    plugins: [
      {
        name: `dev-main-log-${label}`,
        setup(build) {
          build.onStart(() => console.log(`[dev-main:${label}] building...`));
          build.onEnd((result) =>
            console.log(
              result.errors.length
                ? `[dev-main:${label}] ${result.errors.length} erreur(s)`
                : `[dev-main:${label}] ready`,
            ),
          );
        },
      },
    ],
  };
}

async function createContexts(entries: {
  esm: string[];
  cjs: string[];
}): Promise<BuildContext[]> {
  const contexts: BuildContext[] = [];

  if (entries.esm.length > 0) {
    const esmCtx = await context({
      ...sharedOptions("esm"),
      entryPoints: entries.esm,
      format: "esm",
    });
    await esmCtx.watch();
    contexts.push(esmCtx);
  }

  if (entries.cjs.length > 0) {
    const cjsCtx = await context({
      ...sharedOptions("cjs"),
      entryPoints: entries.cjs,
      format: "cjs",
      outExtension: { ".js": ".cjs" },
    });
    await cjsCtx.watch();
    contexts.push(cjsCtx);
  }

  return contexts;
}

async function main(): Promise<void> {
  let entries = collectEntries(MAIN_DIR);
  let contexts = await createContexts(entries);

  // Un nouveau fichier n'est pas vu par esbuild : on recrée les contextes si la liste change.
  let timer: NodeJS.Timeout | undefined;
  fs.watch(MAIN_DIR, { recursive: true }, (_event, filename) => {
    if (!filename || !isSource(filename.toString())) return;

    clearTimeout(timer);
    timer = setTimeout(async () => {
      const next = collectEntries(MAIN_DIR);
      const changed =
        next.esm.length !== entries.esm.length ||
        next.cjs.length !== entries.cjs.length ||
        next.esm.some((f, i) => f !== entries.esm[i]) ||
        next.cjs.some((f, i) => f !== entries.cjs[i]);
      if (!changed) return;

      entries = next;
      await Promise.all(contexts.map((c) => c.dispose()));
      contexts = await createContexts(entries);
    }, 200);
  });

  const stop = async () => {
    await Promise.all(contexts.map((c) => c.dispose()));
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((err: unknown) => {
  console.error("[dev-main] échec :", err);
  process.exit(1);
});
