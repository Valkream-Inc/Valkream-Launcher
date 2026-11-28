/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Calcule le `hash` à reporter dans un latest.yml, avec le MÊME algorithme que le launcher :
 *   - un manifeste (`.json` { "chemin": sha256 }) → hash du manifeste (types hash_url / steam_library…)
 *   - tout autre fichier (ex. un `.zip`)           → sha256 du fichier (type zip_url)
 *
 *   yarn tsx scripts/hash-file.ts <fichier> [--ignore <motif>]... [--latest <latest.yml> --entry <niveau.nom>]
 *
 * Avec --latest et --entry, le hash est écrit directement dans le latest.yml.
 */

import fs from "node:fs";

import { setEntryHash } from "./update-latest";
import { hashAnyFile } from "../main/src/instances/tools/hash-file";

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

  const [file] = positional;
  if (!file || ignore.includes("") || Boolean(latest) !== Boolean(entry)) {
    console.error("Usage : hash-file <fichier> [--ignore <motif>]... [--latest <latest.yml> --entry <niveau.nom>]");
    process.exit(1);
  }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    console.error(`Fichier introuvable : ${file}`);
    process.exit(1);
  }

  const summary = await hashAnyFile(file, ignore);
  const hash = summary.hash;
  console.log(`${summary.kind === "manifest" ? "manifeste" : "fichier"} : ${file}`);

  if (latest && entry) {
    fs.writeFileSync(latest, setEntryHash(fs.readFileSync(latest, "utf8"), entry, hash, latest));
    console.log(`hash ${hash} écrit dans ${latest} (${entry})`);
    return;
  }
  console.log(`\nÀ reporter dans l'entrée du latest.yml :\n  hash: ${hash}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
