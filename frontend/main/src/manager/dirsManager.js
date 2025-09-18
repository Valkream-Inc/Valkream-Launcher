const path = require("path");
const newDir = require("../utils/new-dir.js");

class DirsManager {
  launcherRootPath = () => process.cwd();

  rootPath = () =>
    newDir({
      win32: path.join(this.launcherRootPath(), "data"),
      linux: path.join(this.launcherRootPath(), "data"),
      darwin: path.join(this.launcherRootPath(), "data"),
    });

  gameRootPath = () =>
    newDir({
      win32: path.join(this.rootPath(), "game"),
      linux: path.join(this.rootPath(), "game"),
      darwin: path.join(this.rootPath(), "game"),
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
      win32: path.join(this.gameRootPath(), "Modpack"),
      linux: path.join(this.gameRootPath(), "Modpack"),
      darwin: path.join(this.gameRootPath(), "Modpack"),
    });

  downloadModsPath = () =>
    newDir({
      win32: path.join(this.downloadModPackPath(), "mods"),
      linux: path.join(this.downloadModPackPath(), "mods"),
      darwin: path.join(this.downloadModPackPath(), "mods"),
    });
}

const dirsManager = new DirsManager();
module.exports = dirsManager;
