const ThunderstoreManager = require("../../manager/thunderstoreManager");

class CustomMods {
  async install(event, date, mods) {
    const callback = (text, processedBytes, totalBytes, percent, speed) => {
      event.reply(`progress-${date}`, {
        text,
        processedBytes,
        totalBytes,
        percent,
        speed,
      });
    };

    await ThunderstoreManager.InstallCustomMods(mods, callback);
    return;
  }

  async uninstall(mods) {
    await ThunderstoreManager.unInstallCustomMods(mods);
    return;
  }
}

const customModsManager = new CustomMods();
module.exports = customModsManager;
