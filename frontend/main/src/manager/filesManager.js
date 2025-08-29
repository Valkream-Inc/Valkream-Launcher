/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const path = require("path");
const { platform } = require("os");

const DirsManager = require("./dirsManager.js");

class FilesManager {
  uninstallerPath = () =>
    path.join(
      DirsManager.launcherRootPath(),
      "Uninstall Valkream-Launcher.exe"
    );

  gameZipPath = () => path.join(DirsManager.gameRootPath(), "game.zip");

  bepInExZipPath = () => path.join(DirsManager.gameRootPath(), "bepinex.zip");

  modpackZipPath = () => path.join(DirsManager.gameRootPath(), "modpack.zip");

  gameExePath = () => {
    const valueForAllPlatforms = {
      win32: path.join(DirsManager.gamePath(), "Valheim.exe"),
      linux: path.join(DirsManager.gamePath(), "Valheim"),
      darwin: path.join(DirsManager.gamePath(), "Valheim"),
    };

    return valueForAllPlatforms[platform()];
  };

  gameVersionFilePath = () =>
    path.join(DirsManager.gameRootPath(), "latest.yml");

  extractManifestPath = () =>
    path.join(DirsManager.downloadModPackPath(), "manifest.json");

  installedManifestPath = () =>
    path.join(DirsManager.gameRootPath(), "manifest.json");
}

const filesManager = new FilesManager();
module.exports = filesManager;
