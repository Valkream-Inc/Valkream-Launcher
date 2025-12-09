/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const path = require("path");
const { platform } = require("os");

const ValheimDirsManager = require("./ValheimDirsManager.js");

class ValheimFilesManager {
  gameZipPath = () => path.join(ValheimDirsManager.gameRootPath(), "game.zip");

  bepInExZipPath = () =>
    path.join(ValheimDirsManager.gameRootPath(), "bepinex.zip");

  modpackZipPath = () =>
    path.join(ValheimDirsManager.gameRootPath(), "modpack.zip");

  gameExePath = () => {
    const map = {
      win32: path.join(ValheimDirsManager.gamePath(), "Valheim.exe"),
      linux: path.join(ValheimDirsManager.gamePath(), "Valheim"),
      darwin: path.join(ValheimDirsManager.gamePath(), "Valheim"),
    };

    const exe = map[platform()];
    if (!exe) {
      throw new Error(`Unsupported platform: ${platform()}`);
    }
    return exe;
  };

  gameVersionFilePath = () =>
    path.join(ValheimDirsManager.gameRootPath(), "latest.yml");

  extractManifestPath = () =>
    path.join(ValheimDirsManager.downloadModPackPath(), "manifest.json");

  installedManifestPath = () =>
    path.join(ValheimDirsManager.gameRootPath(), "manifest.json");
}

module.exports = new ValheimFilesManager();
