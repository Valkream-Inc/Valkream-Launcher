/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const fs = require("fs");
const { platform } = require("os");

const newDir = (valueForAllPlatforms) => {
  const dirPath = valueForAllPlatforms[platform()];

  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (err) {
    console.error("Erreur lors de la création du dossier:", err.message);
  }

  return dirPath; // toujours un string
};

module.exports = newDir;
