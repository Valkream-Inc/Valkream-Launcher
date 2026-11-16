/**
 * @author Valkream Team
 * @license MIT-NC
 */

import fs from "fs";
import path from "path";
import unzipper from "unzipper";

import type { FileProgressCallback } from "../../types/utils";

import { consoleStreamAnswer } from "./consoleStreamAnswer";
import { formatBytes } from "./formatBytes";

const unZip = async (
  zipPath: string,
  outputPath: string,
  callback: FileProgressCallback = (processedBytes, totalBytes, percent, speed) =>
    consoleStreamAnswer(
      `📦 Décompression ${path.basename(zipPath)}: ${percent}% (${formatBytes(
        processedBytes
      )} / ${formatBytes(totalBytes)}) à ${formatBytes(speed)}/s`
    )
): Promise<void> => {
  const directory = await unzipper.Open.file(zipPath);
  const totalBytes = directory.files.reduce(
    (acc: number, file) => acc + (file.uncompressedSize || 0),
    0
  );
  let processedBytes = 0;
  const startTime = Date.now();

  for (const file of directory.files) {
    const fullPath = path.join(outputPath, file.path);

    // Empêche les chemins dangereux (ex. ../../outside)
    if (!fullPath.startsWith(path.resolve(outputPath))) {
      console.warn(`⚠️ Chemin ignoré pour raison de sécurité : ${file.path}`);
      continue;
    }

    if (file.type === "Directory") {
      // Crée le dossier s'il n'existe pas déjà
      fs.mkdirSync(fullPath, { recursive: true });
      continue;
    }

    // Crée les dossiers parents si nécessaire
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });

    // Décompression du fichier
    await new Promise<void>((resolve, reject) => {
      file
        .stream()
        .on("data", (chunk: Buffer) => {
          processedBytes += chunk.length;
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = elapsed > 0 ? processedBytes / elapsed : 0;
          const percent = Math.round((processedBytes / totalBytes) * 100);
          callback(processedBytes, totalBytes, percent, speed);
        })
        .pipe(fs.createWriteStream(fullPath))
        .on("finish", resolve)
        .on("error", (err: Error) => {
          console.error("\n❌ Erreur pendant la décompression :", err.message);
          reject(err);
        });
    });
  }
};

export { unZip };
