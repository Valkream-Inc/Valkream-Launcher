/**
 * @author Valkream Team
 * @license MIT-NC
 */

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
 * Retourne un objet :
 * {
 *   "sub/folder/file1.txt": "hash1",
 *   "file2.png": "hash2"
 * }
 */
async function hashFolderWithArborescence(rootDir) {
  try {
    const files = getAllFilesInAFolder(rootDir);
    const result = {};

    await Promise.all(
      files.map(async (filePath) => {
        const relative = path.relative(rootDir, filePath).replace(/\\/g, "/"); // compatibilité Windows
        result[relative] = await hashFile(filePath);
      })
    );

    return result;
  } catch (err) {
    console.error("❌ Erreur lors du hash du dossier :", err);
    return {};
  }
}

module.exports = { hashFolderWithArborescence, hashFile };
