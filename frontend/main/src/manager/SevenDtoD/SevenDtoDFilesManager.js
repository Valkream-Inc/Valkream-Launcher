/**
 * @author Valkream Team
 * @license MIT-NC
 */

const path = require("path");
const { platform } = require("os");

const SettingsManager = require("../settingsManager");

class SevenDtoDFilesManager {
  gameExeName = "7DaysToDie.exe";
  gameExePath = async () => {
    const map = {
      win32: path.join(
        await SettingsManager.getSetting("gamePathWithSevenDtoD"),
        this.gameExeName
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
