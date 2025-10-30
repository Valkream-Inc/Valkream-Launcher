/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { getAllFilesInAFolder } = require("./getAllFilesInAFolder");

const hashFolder = async (folderPath, algorithm = "sha256", percent = 100) => {
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

      await new Promise((resolve, reject) => {
        const stream = fs.createReadStream(file, {
          start: 0,
          end: tenPercent - 1,
        });

        stream.on("data", (chunk) => hash.update(chunk));
        stream.on("end", resolve);
        stream.on("error", reject);
      });
    } catch (err) {
      console.warn(`⚠️ Erreur lecture fichier ignoré : ${file}`, err);
    }
  }

  return hash.digest("hex");
};

module.exports = { hashFolder };
