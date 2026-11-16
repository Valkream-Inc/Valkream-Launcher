/**
 * @author Valkream Team
 * @license MIT-NC
 */

import path from "path";
import { platform } from "os";

import ValheimDirsManager from "./ValheimDirsManager";

class ValheimFilesManager {
  gameZipPath = () => path.join(ValheimDirsManager.gameRootPath(), "game.zip");

  bepInExZipPath = () =>
    path.join(ValheimDirsManager.gameRootPath(), "bepinex.zip");

  modpackZipPath = () =>
    path.join(ValheimDirsManager.gameRootPath(), "modpack.zip");

  gameExePath = () => {
    const map: Partial<Record<NodeJS.Platform, string>> = {
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

export default new ValheimFilesManager();
