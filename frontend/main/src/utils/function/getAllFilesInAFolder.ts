/**
 * @author Valkream Team
 * @license MIT-NC
 */

import fs from "fs";
import path from "path";

function getAllFilesInAFolder(dirPath: string): string[] {
  try {
    let results: string[] = [];
    const list = fs.readdirSync(dirPath);

    list.forEach((file) => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat && stat.isDirectory()) {
        results = results.concat(getAllFilesInAFolder(filePath));
      } else {
        results.push(filePath);
      }
    });

    return results;
  } catch (err) {
    console.error("❌ Erreur lors de la lecture du dossier :", dirPath, err);
    return [];
  }
}

export { getAllFilesInAFolder };
