/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * `zip_url` : télécharge une archive et l'extrait dans le dossier de l'entrée.
 * Conservation et exclusions s'appliquent fichier par fichier à l'extraction.
 */

import fs from "fs";
import path from "path";

import { contentForPlatform } from "../link";
import { shouldWriteFile } from "../preserve";
import type { Provider } from "./types";

export const zipProvider: Provider = async (context) => {
  const { entry, entryDir, tempDir, plan, platform, resolver, io, name, signal } = context;

  const content = contentForPlatform(entry.content, platform);
  if (typeof content !== "string") {
    throw new Error(`${name} : pas de lien d'archive pour la plateforme ${platform}`);
  }

  const zipPath = path.join(tempDir, `${name}.zip`);
  context.report("download", `Téléchargement de ${name}`);
  await io.download(resolver.urlOf(content), zipPath, signal, (transfer) =>
      context.report("download", `Téléchargement de ${name}`, transfer),
    );

  context.report("extract", `Extraction de ${name}`);
  fs.mkdirSync(entryDir, { recursive: true });
  await io.extract(zipPath, entryDir, {
    folderInZip: entry.folder_in_zip,
    accept: (relative) =>
      shouldWriteFile(relative, plan, fs.existsSync(path.join(entryDir, relative))),
  });
  fs.rmSync(zipPath, { force: true });

  return { hash: entry.hash };
};
