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

import { LocalizedError } from "../../../lib/errors/localized-error.js";
import { hashFile } from "../state/manifest.js";
import type { ProviderContext } from "./types.js";

export const isTarGz = (url: string): boolean => /\.(tar\.gz|tgz)(?:[?#].*)?$/i.test(url);

export const fetchArchive = async (
  context: ProviderContext,
  link: string,
  outDir: string,
  accept: (relativePath: string) => boolean,
  label: string,
  /** sha256 attendu de l'archive `.zip` (vérifié avant l'extraction). Sans effet sur un `.tar.gz` (extrait au fil du téléchargement). */
  expectedHash?: string,
): Promise<void> => {
  const { entry, tempDir, resolver, io, signal, archives } = context;
  const url = resolver.urlOf(link);
  fs.mkdirSync(outDir, { recursive: true });

  if (isTarGz(url)) {
    const text = context.t("progress.downloadExtract", { label });
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
    context.report("download", context.t("progress.download", { label }));
    await io.download(url, zipPath, signal, (transfer) => context.report("download", context.t("progress.download", { label }), transfer));
    archives.set(link, zipPath);
  }

  if (expectedHash !== undefined) {
    context.report("verify", context.t("progress.verify", { label }));
    const actual = await hashFile(zipPath);
    if (actual.toLowerCase() !== expectedHash.toLowerCase()) {
      archives.release(link); // archive corrompue ou altérée : jamais extraite, jamais réutilisée
      fs.rmSync(zipPath, { force: true });
      throw new LocalizedError("err.zipHashInvalid", { name: label, expected: expectedHash.slice(0, 12), actual: actual.slice(0, 12) });
    }
  }

  context.report("extract", context.t("progress.extract", { label }));
  await io.extract(zipPath, outDir, {
    folderInZip: entry.folder_in_zip,
    accept,
    onProgress: (transfer) => context.report("extract", context.t("progress.extract", { label }), transfer),
  });
  archives.release(link);
};
