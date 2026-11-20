/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Génère, pour une entrée `hash_url` du latest.yml, le manifeste de hash et les
 * fichiers à servir. Utilise le MÊME algorithme que le launcher (instances/install/manifest).
 *
 *   yarn tsx scripts/build-manifest.ts <dossier-source> <dossier-sortie> [--ignore <motif>]...
 *                                      [--latest <latest.yml> --entry <niveau.nom>]
 *
 * Avec --latest et --entry, le `hash` de l'entrée est écrit directement dans le latest.yml.
 *
 * Écrit :
 *   <sortie>/hash.json   manifeste { "chemin/relatif": sha256 }   → `content` de l'entrée
 *   <sortie>/hash/...    copie des fichiers                        → `hash-folder` de l'entrée
 * et affiche le `hash` (+ `to_ignore`) à reporter dans le latest.yml.
 */

import fs from "node:fs";
import path from "node:path";

import { setEntryHash } from "./update-latest";
import { manifestHash, scanManifest } from "../main/src/instances/install/manifest";

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const ignore: string[] = [];
  const positional: string[] = [];
  let latest: string | undefined;
  let entry: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--ignore") ignore.push(args[++i] ?? "");
    else if (args[i] === "--latest") latest = args[++i];
    else if (args[i] === "--entry") entry = args[++i];
    else positional.push(args[i]);
  }

  const [source, output] = positional;
  if (!source || !output || ignore.includes("") || Boolean(latest) !== Boolean(entry)) {
    console.error("Usage : build-manifest <dossier-source> <dossier-sortie> [--ignore <motif>]... [--latest <latest.yml> --entry <niveau.nom>]");
    process.exit(1);
  }
  if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) {
    console.error(`Dossier source introuvable : ${source}`);
    process.exit(1);
  }

  const manifest = await scanManifest(source, ignore);
  const files = Object.keys(manifest);

  fs.rmSync(path.join(output, "hash"), { recursive: true, force: true });
  for (const file of files) {
    const destination = path.join(output, "hash", file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(source, file), destination);
  }
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, "hash.json"), JSON.stringify(manifest, null, 2));

  const hash = manifestHash(manifest, ignore);
  console.log(`${files.length} fichier(s) → ${output}`);

  if (latest && entry) {
    fs.writeFileSync(latest, setEntryHash(fs.readFileSync(latest, "utf8"), entry, hash));
    console.log(`\nhash ${hash} écrit dans ${latest} (${entry})`);
    if (ignore.length > 0) console.log(`Pensez à déclarer to_ignore : ${ignore.join(", ")}`);
    return;
  }

  console.log("\nÀ reporter dans l'entrée du latest.yml :");
  console.log(`  hash: ${hash}`);
  if (ignore.length > 0) {
    console.log("  to_ignore:");
    ignore.forEach((pattern) => console.log(`    - ${pattern}`));
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
