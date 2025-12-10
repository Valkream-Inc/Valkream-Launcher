/**
 * @author Valkream Team
 * @license MIT-NC
 */

const path = require("path");
const newDir = require("../../utils/new-dir.js");

const DirsManager = require("../dirsManager.js");

class SevenDtoDDirsManager {
  rootPath = () => DirsManager.rootPath();

  gameRootPath = () =>
    newDir({
      win32: path.join(this.rootPath(), "game/SevenDtoDGame"),
      linux: path.join(this.rootPath(), "game/SevenDtoDGame"),
      darwin: path.join(this.rootPath(), "game/SevenDtoDGame"),
    });

  modsPath = () =>
    newDir({
      win32: path.join(this.gameRootPath(), "mods"),
      linux: path.join(this.gameRootPath(), "mods"),
      darwin: path.join(this.gameRootPath(), "mods"),
    });
}

module.exports = new SevenDtoDDirsManager();
