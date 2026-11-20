/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Récupération d'une archive pour les providers `zip_url` et `hash_url` (option `zip`) :
 * - `.zip` : téléchargement (avec reprise) puis extraction, avec progression des deux étapes ;
 * - `.tar.gz` / `.tgz` : décompression PENDANT le téléchargement (flux), sans archive sur le disque.
 */

import fs from "fs";
import path from "path";

import type { ProviderContext } from "./types";

export const isTarGz = (url: string): boolean => /\.(tar\.gz|tgz)(?:[?#].*)?$/i.test(url);

export const fetchArchive = async (
  context: ProviderContext,
  link: string,
  outDir: string,
  accept: (relativePath: string) => boolean,
  label: string,
): Promise<void> => {
  const { entry, tempDir, resolver, io, name, signal } = context;
  const url = resolver.urlOf(link);
  fs.mkdirSync(outDir, { recursive: true });

  if (isTarGz(url)) {
    const text = `${label} : téléchargement + extraction`;
    context.report("download", text);
    await io.streamExtract(url, outDir, { folderInZip: entry.folder_in_zip, accept }, signal, (transfer) =>
      context.report("download", text, transfer),
    );
    return;
  }

  const zipPath = path.join(tempDir, `${name}.zip`);
  context.report("download", `${label} : téléchargement`);
  await io.download(url, zipPath, signal, (transfer) => context.report("download", `${label} : téléchargement`, transfer));

  context.report("extract", `${label} : extraction`);
  await io.extract(zipPath, outDir, {
    folderInZip: entry.folder_in_zip,
    accept,
    onProgress: (transfer) => context.report("extract", `${label} : extraction`, transfer),
  });
  fs.rmSync(zipPath, { force: true });
};
