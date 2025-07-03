const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { getAllFilesInAFolder } = require("./getAllFilesInAFolder");

const hashFolder = (folderPath, algorithm = "md5") => {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(folderPath)) {
        return reject(`Dossier non trouvé : ${folderPath}`);
      }

      const hash = crypto.createHash(algorithm);
      const files = getAllFilesInAFolder(folderPath).sort(); // ordre déterministe

      for (const file of files) {
        const relativePath = path.relative(folderPath, file);
        hash.update(relativePath); // inclure le nom du fichier dans le hash
        const data = fs.readFileSync(file);
        hash.update(data); // contenu du fichier
      }

      resolve(hash.digest("hex"));
    } catch (err) {
      reject(`Erreur lors du hash du dossier ${folderPath} : ${err.message}`);
    }
  });
};

module.exports = { hashFolder };
