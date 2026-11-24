/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Accès réels de l'installateur : téléchargement (avec reprise et retries du
 * téléchargeur existant) et extraction zip (unzipper).
 */

import fs from "fs";
import path from "path";

import { assertArchiveWithinLimits } from "../../lib/archive/archive-limits.js";
import { formatBytes } from "../../lib/format/format-bytes.js";
import { normalizeRelative } from "../../lib/format/patterns.js";
import { isPathInside } from "../../lib/fs/paths.js";
import { downloadFile } from "../../lib/net/download-file.js";
import { streamExtractTarGz } from "./files/stream-extract.js";
import type { InstallIO } from "./providers/types.js";
import { progressOf } from "./state/progress.js";

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
    // Chargé à la demande : seuls les zip en ont besoin
    const { default: unzipper } = await import("unzipper");
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
