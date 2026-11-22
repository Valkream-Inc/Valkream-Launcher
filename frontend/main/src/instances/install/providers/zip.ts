/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * `zip_url` : télécharge une archive (`.zip`, ou `.tar.gz` extrait pendant le téléchargement) et l'extrait dans le dossier de l'entrée.
 * Conservation et exclusions s'appliquent fichier par fichier à l'extraction ;
 * l'extraction se fait d'abord dans un dossier de préparation (installation atomique).
 */

import fs from "fs";
import path from "path";

import { shouldWriteFile } from "../preserve.js";
import { commitStaged } from "../staging.js";
import { fetchArchive } from "./archive.js";
import type { Provider } from "./types.js";

export const zipProvider: Provider = async (context) => {
  const { entry, entryDir, tempDir, plan, platform, name, beforeCommit } = context;

  const content = entry.content;
  if (typeof content !== "string") {
    throw new Error(`${name} : pas de lien d'archive pour la plateforme ${platform}`);
  }

  // Préparation dans un dossier dédié : l'installation n'est touchée qu'à la bascule.
  const stage = path.join(tempDir, `${name}.stage`);
  fs.rmSync(stage, { recursive: true, force: true });
  await fetchArchive(
    context,
    content,
    stage,
    (relative) => shouldWriteFile(relative, plan, fs.existsSync(path.join(entryDir, relative))),
    name,
  );

  beforeCommit();
  fs.mkdirSync(entryDir, { recursive: true });
  commitStaged(stage, entryDir);

  return { hash: entry.hash };
};
