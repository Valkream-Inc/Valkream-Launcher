/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const path = require("path");
const { app } = require("electron");

const { newDir } = require("../../utils/index.js");
const { isDev } = require("../../utils/index.js");

const SettingsManager = require("../../ipc/handlers/manager/settingsManager");

class DirsManager {
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
      win32: settings || this.defaultRootPath(),
      linux: settings || this.defaultRootPath(),
      darwin: settings || this.defaultRootPath(),
    });
  };

  gameRootPath = async () =>
    await newDir({
      win32: path.join(this.rootPath(), "game"),
      linux: path.join(this.rootPath(), "game"),
      darwin: path.join(this.rootPath(), "game"),
    });

  gamePath = async () =>
    await newDir({
      win32: path.join(this.gameRootDir(), "Valheim"),
      linux: path.join(this.gameRootDir(), "Valheim"),
      darwin: path.join(this.gameRootDir(), "Valheim"),
    });

  gameExePath = async () =>
    await newDir({
      win32: path.join(this.gamePath(), "Valheim.exe"),
      linux: path.join(this.gamePath(), "Valheim"),
      darwin: path.join(this.gamePath(), "Valheim"),
    });

  gamePreservedPath = async () =>
    await newDir({
      win32: path.join(this.gameRootPath(), "preserved"),
      linux: path.join(this.gameRootPath(), "preserved"),
      darwin: path.join(this.gameRootPath(), "preserved"),
    });
}

module.exports = DirsManager;
