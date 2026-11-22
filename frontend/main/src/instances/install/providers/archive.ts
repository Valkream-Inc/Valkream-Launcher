/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Récupération d'une archive pour les providers `zip_url` et `hash_url` (option `zip`) :
 * - `.zip` : téléchargement (avec reprise) puis extraction, avec progression des deux étapes ;
 * - `.tar.gz` / `.tgz` : décompression PENDANT le téléchargement (flux), sans archive sur le disque.
 */

import { createHash } from "crypto";
import fs from "fs";
import path from "path";

import type { ProviderContext } from "./types.js";

export const isTarGz = (url: string): boolean => /\.(tar\.gz|tgz)(?:[?#].*)?$/i.test(url);

export const fetchArchive = async (
  context: ProviderContext,
  link: string,
  outDir: string,
  accept: (relativePath: string) => boolean,
  label: string,
): Promise<void> => {
  const { entry, tempDir, resolver, io, signal, archives } = context;
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

  // Même archive pour plusieurs entrées (un `folder_in_zip` par entrée) : téléchargée une seule fois.
  let zipPath = archives.get(link);
  if (!zipPath) {
    zipPath = path.join(tempDir, `archive-${createHash("sha1").update(url).digest("hex").slice(0, 12)}.zip`);
    context.report("download", `${label} : téléchargement`);
    await io.download(url, zipPath, signal, (transfer) => context.report("download", `${label} : téléchargement`, transfer));
    archives.set(link, zipPath);
  }

  context.report("extract", `${label} : extraction`);
  await io.extract(zipPath, outDir, {
    folderInZip: entry.folder_in_zip,
    accept,
    onProgress: (transfer) => context.report("extract", `${label} : extraction`, transfer),
  });
  archives.release(link);
};
