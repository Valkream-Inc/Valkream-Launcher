/**
 * @author Valkream Team
 * @license MIT-NC
 */

import path from "path";
import { platform } from "os";

import SevenDtoDDirsManager from "./SevenDtoDDirsManager";

class SevenDtoDFilesManager {
  gameZipPath = (): string =>
    path.join(SevenDtoDDirsManager.gameRootPath(), "game.zip");

  gameExePath = (): string => {
    const map: Partial<Record<NodeJS.Platform, string>> = {
      win32: path.join(SevenDtoDDirsManager.gamePath(), "7DaysToDie.exe"),
    };

    const exe = map[platform()];
    if (!exe) {
      throw new Error(`Unsupported platform: ${platform()}`);
    }
    return exe;
  };

  modsToDeleteFixPath = (): string =>
    path.join(SevenDtoDDirsManager.modsFixPath(), "to_delete_into_server.fix");

  gameVersionFilePath = (): string =>
    path.join(SevenDtoDDirsManager.gameRootPath(), "latest.yml");
}

export default new SevenDtoDFilesManager();
