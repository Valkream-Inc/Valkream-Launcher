/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const path = require("path");
const { platform } = require("os");

const DirsManager = require("./dirsManager.js");

class FilesManager {
  constructor() {
    this.dirsManager = DirsManager;
  }

  uninstallerPath = async () => {
    const launcherRootPath = await this.dirsManager.launcherRootPath();
    path.join(launcherRootPath, "Uninstall Valkream-Launcher.exe");
  };

  gameZipPath = async () => {
    const gameRootPath = await this.dirsManager.gameRootPath();
    return path.join(gameRootPath, "game.zip");
  };

  bepInExZipPath = async () => {
    const gameRootPath = await this.dirsManager.gameRootPath();
    return path.join(gameRootPath, "bepinex.zip");
  };

  modpackZipPath = async () => {
    const gameRootPath = await this.dirsManager.gameRootPath();
    return path.join(gameRootPath, "modpack.zip");
  };

  gameExePath = async () => {
    const valueForAllPlatforms = {
      win32: path.join(await this.dirsManager.gamePath(), "Valheim.exe"),
      linux: path.join(await this.dirsManager.gamePath(), "Valheim"),
      darwin: path.join(await this.dirsManager.gamePath(), "Valheim"),
    };

    return valueForAllPlatforms[platform()];
  };

  gameVersionFilePath = async () => {
    const gameRootPath = await this.dirsManager.gameRootPath();
    return path.join(gameRootPath, "latest.yml");
  };

  extractManifestPath = async () => {
    const modPackDir = await this.dirsManager.dowloadModPackPath();
    return path.join(modPackDir, "manifest.json");
  };

  installedManifestPath = async () => {
    const gameRootPath = await this.dirsManager.gameRootPath();
    return path.join(gameRootPath, "manifest.json");
  };
}

const filesManager = new FilesManager();
module.exports = filesManager;
