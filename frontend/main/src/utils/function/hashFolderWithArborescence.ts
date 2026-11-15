/**
 * @author Valkream Team
 * @license MIT-NC
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { getAllFilesInAFolder } = require("./getAllFilesInAFolder");

/**
 * Hash un fichier (sha256)
 */
function hashFile(filePath, algorithm = "sha256") {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(filePath);

    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

/**
 * Hash un dossier et appelle un callback de progression
 * callback(downloadedBytes, totalBytes, percent, speed)
 *
 * Retourne un objet :
 * {
 *   "sub/folder/file1.txt": "hash1",
 *   "file2.png": "hash2"
 * }
 */
async function hashFolderWithArborescence(
  rootDir,
  callback = null,
  text = "Analyse..."
) {
  try {
    const files = getAllFilesInAFolder(rootDir);

    // taille totale à parcourir
    const totalBytes = files.reduce(
      (sum, file) => sum + fs.statSync(file).size,
      0
    );

    const result = {};
    let processedBytes = 0;
    let startTime = Date.now();

    for (const filePath of files) {
      const relative = path.relative(rootDir, filePath).replace(/\\/g, "/");
      const hash = await hashFile(filePath);
      result[relative] = hash;

      processedBytes += fs.statSync(filePath).size;

      if (callback) {
        const percent = ((processedBytes / totalBytes) * 100).toFixed(2);
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = processedBytes / elapsed;

        callback(text, processedBytes, totalBytes, percent, speed);
      }
    }

    return result;
  } catch (err) {
    console.error("❌ Erreur lors du hash du dossier :", err);
    return {};
  }
}

module.exports = { hashFolderWithArborescence, hashFile };
