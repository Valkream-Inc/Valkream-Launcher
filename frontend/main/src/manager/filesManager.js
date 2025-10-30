/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const path = require("path");
const { platform } = require("os");

const DirsManager = require("./dirsManager.js");

class FilesManager {
  uninstallerPath = () => {
    const root = DirsManager.launcherRootPath();
    if (platform() === "win32") {
      return path.join(root, "Uninstall Valkream-Launcher.exe");
    }
    // Fallback pour Linux/macOS → script ou binaire générique
    return path.join(root, "uninstall.sh");
  };

  updaterDetailsPath = () =>
    path.join(DirsManager.rootPath(), "updater-details.flag");

  gameZipPath = () => path.join(DirsManager.gameRootPath(), "game.zip");

  bepInExZipPath = () => path.join(DirsManager.gameRootPath(), "bepinex.zip");

  modpackZipPath = () => path.join(DirsManager.gameRootPath(), "modpack.zip");

  gameExePath = () => {
    const map = {
      win32: path.join(DirsManager.gamePath(), "Valheim.exe"),
      linux: path.join(DirsManager.gamePath(), "Valheim"),
      darwin: path.join(DirsManager.gamePath(), "Valheim"),
    };

    const exe = map[platform()];
    if (!exe) {
      throw new Error(`Unsupported platform: ${platform()}`);
    }
    return exe;
  };

  gameVersionFilePath = () =>
    path.join(DirsManager.gameRootPath(), "latest.yml");

  extractManifestPath = () =>
    path.join(DirsManager.downloadModPackPath(), "manifest.json");

  installedManifestPath = () =>
    path.join(DirsManager.gameRootPath(), "manifest.json");
}

module.exports = new FilesManager();
