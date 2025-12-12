/**
 * @author Valkream Team
 * @license MIT-NC
 */

const path = require("path");
const { platform } = require("os");

const SevenDtoDDirsManager = require("./SevenDtoDDirsManager.js");
const SettingsManager = require("../settingsManager");

class SevenDtoDFilesManager {
  actualHashFilePath = () =>
    path.join(SevenDtoDDirsManager.gameRootPath(), "mods.json");

  gameExePath = () => {
    const map = {
      win32: path.join(
        SettingsManager.getSetting("gamePathWithSevenDtoD"),
        "7DaysToDie.exe"
      ),
    };

    const exe = map[platform()];
    if (!exe) {
      throw new Error(`Unsupported platform: ${platform()}`);
    }
    return exe;
  };
}

module.exports = new SevenDtoDFilesManager();
