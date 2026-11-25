/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Copie d'un fichier par flux : la progression avance aussi pendant les gros fichiers (plusieurs Go),
 * contrairement à `copyFile` qui ne rend la main qu'à la fin.
 */

import fs from "fs";

export const copyFileWithProgress = (from: string, to: string, onBytes: (bytes: number) => void): Promise<void> =>
  new Promise((resolve, reject) => {
    const input = fs.createReadStream(from);
    const output = fs.createWriteStream(to);
    input.on("data", (chunk) => onBytes(chunk.length));
    input.once("error", (error) => {
      output.destroy();
      reject(error);
    });
    output.once("error", (error) => {
      input.destroy();
      reject(error);
    });
    output.once("close", () => resolve());
    input.pipe(output);
  });
