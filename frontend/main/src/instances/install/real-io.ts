/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Accès réels de l'installateur : téléchargement (avec reprise et retries du
 * téléchargeur existant) et extraction zip (unzipper).
 */

import fs from "fs";
import path from "path";
import unzipper from "unzipper";

import { assertArchiveWithinLimits } from "../../lib/archive-limits";
import { downloadFile } from "../../lib/download-file";
import { formatBytes } from "../../lib/format-bytes";
import { isPathInside } from "../../lib/paths";
import { normalizeRelative } from "../../lib/patterns";
import { progressOf } from "./progress";
import type { InstallIO } from "./providers/types";
import { streamExtractTarGz } from "./stream-extract";

export const realInstallIO: InstallIO = {
  async download(url, destination, signal, onProgress) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    // Un fichier partiel de la même URL (fichier distant inchangé) est repris, sinon supprimé : voir download-resume.
    await downloadFile(
      url,
      destination,
      (processed, total, percent, speed) =>
        onProgress?.({
          processedBytes: formatBytes(processed),
          totalBytes: formatBytes(total),
          percent,
          speed: formatBytes(speed),
          processed,
        }),
      signal,
    );
  },

  async extract(zipPath, outDir, { folderInZip, accept, onProgress }) {
    const root = path.resolve(outDir);
    const prefix = folderInZip ? normalizeRelative(folderInZip) : "";
    const directory = await unzipper.Open.file(zipPath);
    const archived = directory.files.filter(
      (file) => file.type !== "Directory",
    );
    assertArchiveWithinLimits(archived);
    const totalBytes = archived.reduce(
      (sum, file) => sum + file.uncompressedSize,
      0,
    );
    const startedAt = Date.now();
    let extracted = 0;

    for (const file of directory.files) {
      if (file.type === "Directory") continue;

      let relative = normalizeRelative(file.path);
      if (prefix !== "") {
        if (relative !== prefix && !relative.startsWith(prefix + "/")) continue;
        relative = relative.slice(prefix.length + 1);
      }
      if (relative === "" || !accept(relative)) continue;

      // Zip slip : le fichier doit rester sous le dossier de destination.
      const fullPath = path.resolve(root, relative);
      if (!isPathInside(root, fullPath)) {
        console.warn(`⚠️ Chemin ignoré (hors destination) : ${file.path}`);
        continue;
      }

      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      await new Promise<void>((resolve, reject) => {
        file
          .stream()
          .on("error", reject)
          .on("data", (chunk: Buffer) => {
            extracted += chunk.length;
            onProgress?.(progressOf(extracted, totalBytes, startedAt));
          })
          .pipe(fs.createWriteStream(fullPath))
          .on("finish", resolve)
          .on("error", reject);
      });
    }
  },

  streamExtract: streamExtractTarGz,
};
