/**
 * @author Valkream Team
 * @license MIT-NC
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getAllFilesInAFolder } from "./getAllFilesInAFolder";

const hashFolder = async (
  folderPath: string,
  algorithm = "sha256",
  percent = 100
): Promise<string> => {
  if (!fs.existsSync(folderPath)) {
    throw new Error(`Dossier non trouvé : ${folderPath}`);
  }

  const files = getAllFilesInAFolder(folderPath).sort();
  const hash = crypto.createHash(algorithm);

  for (const file of files) {
    const relativePath = path.relative(folderPath, file);
    hash.update(relativePath); // Inclure le chemin dans le hash

    try {
      const { size } = fs.statSync(file);
      if (size === 0) continue;
      const tenPercent = Math.ceil(size * (percent / 100));

      await new Promise<void>((resolve, reject) => {
        const stream = fs.createReadStream(file, {
          start: 0,
          end: tenPercent - 1,
        });

        stream.on("data", (chunk: string | Buffer) => hash.update(chunk));
        stream.on("end", resolve);
        stream.on("error", reject);
      });
    } catch (err) {
      console.warn(`⚠️ Erreur lecture fichier ignoré : ${file}`, err);
    }
  }

  return hash.digest("hex");
};

export { hashFolder };
