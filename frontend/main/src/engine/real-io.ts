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

import { downloadFile } from "../utils/function/dowloadFile";
import { formatBytes } from "../utils/function/formatBytes";
import { isPathInside } from "./paths";
import { normalizeRelative } from "./patterns";
import type { InstallIO } from "./providers/types";

export const realInstallIO: InstallIO = {
  async download(url, destination, signal, onProgress) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.rmSync(destination, { force: true }); // jamais de reprise sur un fichier d'une autre synchro
    await downloadFile(
      url,
      destination,
      (processed, total, percent, speed) =>
        onProgress?.({
          processedBytes: formatBytes(processed),
          totalBytes: formatBytes(total),
          percent,
          speed: formatBytes(speed),
        }),
      signal
    );
  },

  async extract(zipPath, outDir, { folderInZip, accept }) {
    const root = path.resolve(outDir);
    const prefix = folderInZip ? normalizeRelative(folderInZip) : "";
    const directory = await unzipper.Open.file(zipPath);

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
          .pipe(fs.createWriteStream(fullPath))
          .on("finish", resolve)
          .on("error", reject);
      });
    }
  },
};
