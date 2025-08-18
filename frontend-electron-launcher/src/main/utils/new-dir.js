/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const fs = require("fs");
const { platform } = require("os");

const newDir = async (valueForAllPlatforms) => {
  const createFolderIfNotExists = async (path) => {
    try {
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
      }
    } catch (err) {
      console.error("Erreur lors de la création du dossier:", err.message);
    } finally {
      return path;
    }
  };

  const path = await createFolderIfNotExists(valueForAllPlatforms[platform()]);
  return path;
};

module.exports = newDir;
