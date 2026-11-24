/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Génère, pour une entrée `hash_url` du latest.yml, le manifeste de hash et les
 * fichiers à servir. Utilise le MÊME algorithme que le launcher (instances/install/manifest).
 *
 *   yarn tsx scripts/build-manifest.ts <dossier-source> <dossier-sortie> [--ignore <motif>]...
 *                                      [--latest <latest.yml> --entry <niveau.nom>] [--manifest-only]
 *
 * --manifest-only : écrit seulement hash.json (jeux Steam : on ne copie ni n'héberge les fichiers du jeu).
 *
 * Avec --latest et --entry, le `hash` de l'entrée est écrit directement dans le latest.yml.
 *
 * Écrit :
 *   <sortie>/hash.json   manifeste { "chemin/relatif": sha256 }   → `content` de l'entrée
 *   <sortie>/hash/...    copie des fichiers                        → `hash-folder` de l'entrée
 * et affiche le `hash` (+ `to_ignore`) à reporter dans le latest.yml.
 */

import fs from "node:fs";

import { setEntryHash } from "./update-latest";
import { exportHashFolder, exportManifestOnly } from "../main/src/instances/tools/hash-folder";

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const ignore: string[] = [];
  const positional: string[] = [];
  let latest: string | undefined;
  let entry: string | undefined;
  let manifestOnly = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--ignore") ignore.push(args[++i] ?? "");
    else if (args[i] === "--latest") latest = args[++i];
    else if (args[i] === "--entry") entry = args[++i];
    else if (args[i] === "--manifest-only") manifestOnly = true;
    else positional.push(args[i]);
  }

  // Dossier de travail de DepotDownloader (jeu téléchargé par depot) : jamais une partie du jeu
  if (!ignore.includes(".DepotDownloader/**")) ignore.push(".DepotDownloader/**");

  const [source, output] = positional;
  if (!source || !output || ignore.includes("") || Boolean(latest) !== Boolean(entry)) {
    console.error("Usage : build-manifest <dossier-source> <dossier-sortie> [--ignore <motif>]... [--latest <latest.yml> --entry <niveau.nom>]");
    process.exit(1);
  }
  if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) {
    console.error(`Dossier source introuvable : ${source}`);
    process.exit(1);
  }

  // --manifest-only : jeu commercial (steam_library), seul le hash.json est écrit, aucun fichier copié
  const { hash, fileCount } = await (manifestOnly ? exportManifestOnly : exportHashFolder)(source, output, ignore);
  console.log(`${fileCount} fichier(s) → ${output}`);

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
