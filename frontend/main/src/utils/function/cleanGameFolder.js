/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const fs = require("fs");
const path = require("path");

const cleanGameFolder = (ValheimValkreamDataPath, foldersToClean) => {
  for (let folderToClean of foldersToClean) {
    const folderToCleanPath = path.join(ValheimValkreamDataPath, folderToClean);

    if (fs.existsSync(folderToCleanPath)) {
      fs.rmSync(folderToCleanPath, { recursive: true });
    }
  }
};

module.exports = { cleanGameFolder };
