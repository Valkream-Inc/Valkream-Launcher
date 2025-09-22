const VersionManager = require("../../manager/versionManager.js");
const ThunderstoreManager = require("../../manager/thunderstoreManager.js");
const GameManager = require("../../manager/gameManager.js");

const { isSteamInstallation } = require("../../constants/index.js");
const Reload = require("./reload.js");

class Install {
  async init(event) {
    const callback = (text, processedBytes, totalBytes, percent, speed) => {
      // CORRECT: Use event.sender.send for one-way messages
      event.sender.send("progress-install", {
        text,
        processedBytes,
        totalBytes,
        percent,
        speed,
      });
    };

    try {
      await GameManager.uninstall();
      await Reload.init();

      if (!isSteamInstallation) {
        await GameManager.dowload(callback);
        await GameManager.unzip(callback);
      }

      await GameManager.dowloadBepInEx(callback);
      await GameManager.unzipBepInEx(callback);

      await ThunderstoreManager.downloadModpack(callback);
      await ThunderstoreManager.unzipModpack(callback);

      await ThunderstoreManager.dowloadMods(callback);
      await ThunderstoreManager.unzipMods(callback);

      await VersionManager.updateLocalVersionConfig();
      await Reload.init();

      // CORRECT: Use event.sender.send for the "done" message
      event.sender.send("done-install");
      return { success: true };
    } catch (err) {
      console.error(err);
      // CORRECT: Use event.sender.send for the "error" message
      event.sender.send("error-install", { message: err.message });
      throw err;
    }
  }
}

const installManager = new Install();
module.exports = installManager;
