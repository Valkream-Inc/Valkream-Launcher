/**
 * @author Valkream Team
 * @license MIT-NC
 */

const path = require("path");

const SevenDtoDDirsManager = require("./SevenDtoDDirsManager.js");

class SevenDtoDFilesManager {
  actualHashFilePath = () =>
    path.join(SevenDtoDDirsManager.gameRootPath(), "latest.json");
}

module.exports = new SevenDtoDFilesManager();
