const fs = require("fs");
const path = require("path");

const { gameFolderToClean } = require("../config.js");

const cleanGameFolder = (ValheimValkreamDataPath) => {
  const foldersToClean = gameFolderToClean;

  for (let folderToClean of foldersToClean) {
    const folderToCleanPath = path.join(ValheimValkreamDataPath, folderToClean);

    if (fs.existsSync(folderToCleanPath)) {
      fs.rmSync(folderToCleanPath, { recursive: true });
    }
  }
};

module.exports = { cleanGameFolder };
