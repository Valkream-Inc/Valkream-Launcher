/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const fs = require("fs");
const path = require("path");

function getAllFilesInAFolder(dirPath) {
  try {
    let results = [];
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

module.exports = { getAllFilesInAFolder };
