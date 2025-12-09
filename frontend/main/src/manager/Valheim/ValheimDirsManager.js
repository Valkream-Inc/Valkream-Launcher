/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const path = require("path");
const newDir = require("../../utils/new-dir.js");

const DirsManager = require("../dirsManager.js");

class ValheimDirsManager {
  rootPath = () => DirsManager.rootPath();

  gameRootPath = () =>
    newDir({
      win32: path.join(this.rootPath(), "game/ValheimGame"),
      linux: path.join(this.rootPath(), "game/ValheimGame"),
      darwin: path.join(this.rootPath(), "game/ValheimGame"),
    });

  gamePath = () =>
    newDir({
      win32: path.join(this.gameRootPath(), "Valheim"),
      linux: path.join(this.gameRootPath(), "Valheim"),
      darwin: path.join(this.gameRootPath(), "Valheim"),
    });

  gamePreservedPath = () =>
    newDir({
      win32: path.join(this.gameRootPath(), "preserved"),
      linux: path.join(this.gameRootPath(), "preserved"),
      darwin: path.join(this.gameRootPath(), "preserved"),
    });

  bepInExPath = () =>
    newDir({
      win32: path.join(this.gamePath(), "BepInEx"),
      linux: path.join(this.gamePath(), "BepInEx"),
      darwin: path.join(this.gamePath(), "BepInEx"),
    });

  bepInExConfigPath = () =>
    newDir({
      win32: path.join(this.bepInExPath(), "config"),
      linux: path.join(this.bepInExPath(), "config"),
      darwin: path.join(this.bepInExPath(), "config"),
    });

  bepInExPluginsPath = () =>
    newDir({
      win32: path.join(this.bepInExPath(), "plugins"),
      linux: path.join(this.bepInExPath(), "plugins"),
      darwin: path.join(this.bepInExPath(), "plugins"),
    });

  downloadModPackPath = () =>
    newDir({
      win32: path.join(this.gameRootPath(), "modpack"),
      linux: path.join(this.gameRootPath(), "modpack"),
      darwin: path.join(this.gameRootPath(), "modpack"),
    });

  downloadModsPath = () =>
    newDir({
      win32: path.join(this.downloadModPackPath(), "mods"),
      linux: path.join(this.downloadModPackPath(), "mods"),
      darwin: path.join(this.downloadModPackPath(), "mods"),
    });
}

module.exports = new ValheimDirsManager();
