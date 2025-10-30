/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const VersionManager = require("../../manager/versionManager.js");
const ThunderstoreManager = require("../../manager/thunderstoreManager.js");
const GameManager = require("../../manager/gameManager.js");

const { formatBytes } = require("../../utils/function/formatBytes");

class Install {
  async init(event) {
    const callback = (text, processedBytes, totalBytes, percent, speed) => {
      event.sender.send("progress-install", {
        text,
        processedBytes: formatBytes(processedBytes),
        totalBytes: formatBytes(totalBytes),
        percent,
        speed: formatBytes(speed),
      });
    };

    try {
      await GameManager.uninstall();

      await GameManager.dowloadGame(callback);
      await GameManager.unzipGame(callback);
      await GameManager.finishGame();

      await GameManager.dowloadBepInEx(callback);
      await GameManager.unzipBepInEx(callback);
      await GameManager.finishBepInEx();

      await ThunderstoreManager.downloadModpack(callback);
      await ThunderstoreManager.unzipModpack(callback);
      await ThunderstoreManager.finishModpack();

      await ThunderstoreManager.dowloadMods(callback);
      await ThunderstoreManager.unzipMods(callback);
      await ThunderstoreManager.finishMods();

      await VersionManager.updateLocalVersionConfig();

      event.sender.send("done-install");
      return { success: true };
    } catch (err) {
      console.error(err);
      event.sender.send("error-install", { message: err.message });
      throw err;
    }
  }
}

const installManager = new Install();
module.exports = installManager;
