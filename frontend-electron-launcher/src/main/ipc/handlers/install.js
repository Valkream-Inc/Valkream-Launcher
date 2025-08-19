const VersionManager = require("../../manager/versionManager");
const ThunderstoreManager = require("../../manager/thunderstoreManager");
const GameManager = require("../../manager/gameManager");

const { isSteamInstallation } = require("../../constants");
const Reload = require("./reload.js");

class Install {
  async init(event, date) {
    const callback = (text, processedBytes, totalBytes, percent, speed) => {
      event.reply(`progress-${date}`, {
        text,
        processedBytes,
        totalBytes,
        percent,
        speed,
      });
    };

    try {
      await GameManager.uninstall();
      await Reload.init(); // initialisation des sous-folders supprimés

      if (!isSteamInstallation) {
        await GameManager.dowload(callback);
        await GameManager.unzip(callback);
      } // installation steam a implémenter...

      await GameManager.dowloadBepInEx(callback);
      await GameManager.unzipBepInEx(callback);

      await ThunderstoreManager.downloadModpack(callback);
      await ThunderstoreManager.unzipModpack(callback);

      await ThunderstoreManager.dowloadMods(callback);
      await ThunderstoreManager.unzipMods(callback);

      await VersionManager.updateLocalVersionConfig();
      await Reload.init();
    } catch (err) {
      console.error(err);
      event.reply(`error-${date}`, err.message);
    } finally {
      event.reply(`done-${date}`);
    }
  }
}

const installManager = new Install();
module.exports = installManager;
