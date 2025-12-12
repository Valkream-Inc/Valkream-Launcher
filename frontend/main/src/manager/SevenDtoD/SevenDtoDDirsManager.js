/**
 * @author Valkream Team
 * @license MIT-NC
 */

const path = require("path");
const newDir = require("../../utils/new-dir.js");

const DirsManager = require("../dirsManager.js");
const SettingsManager = require("../settingsManager");

class SevenDtoDDirsManager {
  rootPath = () => DirsManager.rootPath();

  gameRootPath = () =>
    newDir({
      win32: path.join(this.rootPath(), "game/SevenDtoDGame"),
      linux: path.join(this.rootPath(), "game/SevenDtoDGame"),
      darwin: path.join(this.rootPath(), "game/SevenDtoDGame"),
    });

  gamePath = () =>
    newDir({
      win32: path.join(this.gameRootPath(), "SevenDtoD"),
      linux: path.join(this.gameRootPath(), "SevenDtoD"),
      darwin: path.join(this.gameRootPath(), "SevenDtoD"),
    });

  // mods
  modsPath = () =>
    newDir({
      win32: path.join(this.gamePath(), "Mods"),
      linux: path.join(this.gamePath(), "Mods"),
      darwin: path.join(this.gamePath(), "Mods"),
    });

  installedModsPath = () =>
    path.join(SettingsManager.getSetting("gamePathWithSevenDtoD"), "Mods");
}

module.exports = new SevenDtoDDirsManager();
