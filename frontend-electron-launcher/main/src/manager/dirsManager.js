const path = require("path");
const { app } = require("electron");

const newDir = require("../utils/new-dir.js");
const { isDev } = require("../constants");

class DirsManager {
  launcherRootPath = () => process.cwd();

  defaultRootPath = async () => {
    const basePath = isDev ? app.getAppPath() : app.getPath("appData");
    return newDir({
      win32: path.join(basePath, ".valkream-launcher-data"),
      linux: path.join(basePath, ".valkream-launcher-data"),
      darwin: path.join(basePath, ".valkream-launcher-data"),
    });
  };

  rootPath = async () => {
    const SettingsManager = require("./settingsManager.js");
    const settings = await SettingsManager.getSetting("customGamePath");
    const defaultPath = await this.defaultRootPath();

    return newDir({
      win32: settings || defaultPath,
      linux: settings || defaultPath,
      darwin: settings || defaultPath,
    });
  };

  gameRootPath = async () => {
    const root = await this.rootPath();
    return newDir({
      win32: path.join(root, "game"),
      linux: path.join(root, "game"),
      darwin: path.join(root, "game"),
    });
  };

  gamePath = async () => {
    const gameRoot = await this.gameRootPath();
    return newDir({
      win32: path.join(gameRoot, "Valheim"),
      linux: path.join(gameRoot, "Valheim"),
      darwin: path.join(gameRoot, "Valheim"),
    });
  };

  gamePreservedPath = async () => {
    const gameRoot = await this.gameRootPath();
    return newDir({
      win32: path.join(gameRoot, "preserved"),
      linux: path.join(gameRoot, "preserved"),
      darwin: path.join(gameRoot, "preserved"),
    });
  };

  bepInExPath = async () => {
    const game = await this.gamePath();
    return newDir({
      win32: path.join(game, "BepInEx"),
      linux: path.join(game, "BepInEx"),
      darwin: path.join(game, "BepInEx"),
    });
  };

  bepInExConfigPath = async () => {
    const bepInEx = await this.bepInExPath();
    return newDir({
      win32: path.join(bepInEx, "config"),
      linux: path.join(bepInEx, "config"),
      darwin: path.join(bepInEx, "config"),
    });
  };

  bepInExPluginsPath = async () => {
    const bepInEx = await this.bepInExPath();
    return newDir({
      win32: path.join(bepInEx, "plugins"),
      linux: path.join(bepInEx, "plugins"),
      darwin: path.join(bepInEx, "plugins"),
    });
  };

  downloadModPackPath = async () => {
    const gameRoot = await this.gameRootPath();
    return newDir({
      win32: path.join(gameRoot, "Modpack"),
      linux: path.join(gameRoot, "Modpack"),
      darwin: path.join(gameRoot, "Modpack"),
    });
  };

  downloadModsPath = async () => {
    const modPack = await this.downloadModPackPath();
    return newDir({
      win32: path.join(modPack, "mods"),
      linux: path.join(modPack, "mods"),
      darwin: path.join(modPack, "mods"),
    });
  };
}

const dirsManager = new DirsManager();
module.exports = dirsManager;
