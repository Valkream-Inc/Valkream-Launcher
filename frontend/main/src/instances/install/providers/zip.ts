/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * `zip_url` : télécharge une archive et l'extrait dans le dossier de l'entrée.
 * Conservation et exclusions s'appliquent fichier par fichier à l'extraction ;
 * l'extraction se fait d'abord dans un dossier de préparation (installation atomique).
 */

import fs from "fs";
import path from "path";

import { shouldWriteFile } from "../preserve";
import { commitStaged } from "../staging";
import type { Provider } from "./types";

export const zipProvider: Provider = async (context) => {
  const { entry, entryDir, tempDir, plan, platform, resolver, io, name, signal, beforeCommit } = context;

  const content = entry.content;
  if (typeof content !== "string") {
    throw new Error(`${name} : pas de lien d'archive pour la plateforme ${platform}`);
  }

  const zipPath = path.join(tempDir, `${name}.zip`);
  context.report("download", `Téléchargement de ${name}`);
  await io.download(resolver.urlOf(content), zipPath, signal, (transfer) =>
      context.report("download", `Téléchargement de ${name}`, transfer),
    );

  // Extraction dans un dossier de préparation : l'installation n'est touchée qu'à la bascule.
  context.report("extract", `Extraction de ${name}`);
  const stage = path.join(tempDir, `${name}.stage`);
  fs.rmSync(stage, { recursive: true, force: true });
  fs.mkdirSync(stage, { recursive: true });
  await io.extract(zipPath, stage, {
    folderInZip: entry.folder_in_zip,
    accept: (relative) =>
      shouldWriteFile(relative, plan, fs.existsSync(path.join(entryDir, relative))),
  });
  fs.rmSync(zipPath, { force: true });

  beforeCommit();
  fs.mkdirSync(entryDir, { recursive: true });
  commitStaged(stage, entryDir);

  return { hash: entry.hash };
};
