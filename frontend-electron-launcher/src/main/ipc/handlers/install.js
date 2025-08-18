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

    await GameManager.uninstall();
    await Reload.init(); // initialisation des sous-folders supprimés

    if (!isSteamInstallation) {
      await GameManager.dowload(callback);
      await GameManager.unzip(callback);
    } // installation steam a implémenter...

    await GameManager.dowloadBepInEx(this.callback);
    await GameManager.unzipBepInEx(this.callback);

    await ThunderstoreManager.downloadModpack(this.callback);
    await ThunderstoreManager.unzipModpack(this.callback);

    await ThunderstoreManager.dowloadMods(this.callback);
    await ThunderstoreManager.unzipMods(this.callback);

    await VersionManager.updateLocalVersionConfig();
    await Reload.init();
  }
}

const installManager = new Install();
module.exports = installManager;
