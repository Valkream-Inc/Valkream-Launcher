/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const path = require("path");
const fs = require("fs");
const { platform } = require("os");

const { app } = require("electron");
const dev = process.env.NODE_ENV === "dev";

const { database } = require(window.PathsManager.getSharedUtils());

// managers
class FileManager {
  constructor() {
    this.db = new database();
  }

  defaultRootPath = async () =>
    await newDir({
      win32: path.join(
        dev ? app.getAppPath() : app.getPath("appData"),
        ".valkream-launcher-data"
      ),
      linux: path.join(
        dev ? app.getAppPath() : app.getPath("appData"),
        ".valkream-launcher-data"
      ),
      darwin: path.join(
        dev ? app.getAppPath() : app.getPath("appData"),
        ".valkream-launcher-data"
      ),
    });

  rootPath = async () => {
    const settings = (await this.db.readData("configClient"))?.launcher_config
      ?.customGamePath;

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

module.exports = FileManager;
