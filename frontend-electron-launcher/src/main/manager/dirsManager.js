/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const path = require("path");
const { app } = require("electron");

const { newDir } = require("../utils/index.js");
const { isDev } = require("../utils/index.js");

const SettingsManager = require("./settingsManager.js");

class DirsManager {
  launcherRootPath = async () => process.cwd();

  defaultRootPath = async () =>
    await newDir({
      win32: path.join(
        isDev ? app.getAppPath() : app.getPath("appData"),
        ".valkream-launcher-data"
      ),
      linux: path.join(
        isDev ? app.getAppPath() : app.getPath("appData"),
        ".valkream-launcher-data"
      ),
      darwin: path.join(
        isDev ? app.getAppPath() : app.getPath("appData"),
        ".valkream-launcher-data"
      ),
    });

  rootPath = async () => {
    const settings = new SettingsManager().getSetting("customGamePath");

    return await newDir({
      win32: settings || (await this.defaultRootPath()),
      linux: settings || (await this.defaultRootPath()),
      darwin: settings || (await this.defaultRootPath()),
    });
  };

  gameRootPath = async () =>
    await newDir({
      win32: path.join(await this.rootPath(), "game"),
      linux: path.join(await this.rootPath(), "game"),
      darwin: path.join(await this.rootPath(), "game"),
    });

  gamePath = async () =>
    await newDir({
      win32: path.join(await this.gameRootDir(), "Valheim"),
      linux: path.join(await this.gameRootDir(), "Valheim"),
      darwin: path.join(await this.gameRootDir(), "Valheim"),
    });

  gamePreservedPath = async () =>
    await newDir({
      win32: path.join(await this.gameRootPath(), "preserved"),
      linux: path.join(await this.gameRootPath(), "preserved"),
      darwin: path.join(await this.gameRootPath(), "preserved"),
    });

  bepInExPath = async () =>
    await newDir({
      win32: path.join(await this.gamePath(), "BepInEx"),
      linux: path.join(await this.gamePath(), "BepInEx"),
      darwin: path.join(await this.gamePath(), "BepInEx"),
    });

  bepInExConfigPath = async () =>
    await newDir({
      win32: path.join(await this.bepInExPath(), "config"),
      linux: path.join(await this.bepInExPath(), "config"),
      darwin: path.join(await this.bepInExPath(), "config"),
    });

  bepInExPluginsPath = async () =>
    await newDir({
      win32: path.join(await this.bepInExPath(), "plugins"),
      linux: path.join(await this.bepInExPath(), "plugins"),
      darwin: path.join(await this.bepInExPath(), "plugins"),
    });

  dowloadModPackPath = async () =>
    await newDir({
      win32: path.join(await this.gameRootPath(), "Modpack"),
      linux: path.join(await this.gameRootPath(), "Modpack"),
      darwin: path.join(await this.gameRootPath(), "Modpack"),
    });

  dowloadModsPath = async () =>
    await newDir({
      win32: path.join(await this.dowloadModPackPath(), "mods"),
      linux: path.join(await this.dowloadModPackPath(), "mods"),
      darwin: path.join(await this.dowloadModPackPath(), "mods"),
    });
}

const dirsManager = new DirsManager();
module.exports = dirsManager;
