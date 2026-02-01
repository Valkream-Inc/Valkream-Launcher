/**
 * @author Valkream Team
 * @license MIT-NC
 */

const path = require("path");
const { platform } = require("os");

const SevenDtoDDirsManager = require("./SevenDtoDDirsManager");

class SevenDtoDFilesManager {
  gameZipPath = () =>
    path.join(SevenDtoDDirsManager.gameRootPath(), "game.zip");

  gameExePath = async () => {
    const map = {
      win32: path.join(await SevenDtoDDirsManager.gamePath(), "7DaysToDie.exe"),
    };

    const exe = map[platform()];
    if (!exe) {
      throw new Error(`Unsupported platform: ${platform()}`);
    }
    return exe;
  };

  modsToDeleteFixPath = () =>
    path.join(SevenDtoDDirsManager.modsFixPath(), "to_delete_into_server.fix");

  gameVersionFilePath = () =>
    path.join(SevenDtoDDirsManager.gameRootPath(), "latest.yml");
}

module.exports = new SevenDtoDFilesManager();
