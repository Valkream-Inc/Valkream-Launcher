const SettingsManager = require("../../manager/settingsManager");
const SteamManager = require("../../manager/steamManager");
const GameManager = require("../../manager/gameManager");

class Start {
  async init(videoBackground) {
    const launchSteam = SettingsManager.getSetting("launchSteam");

    if (launchSteam) await SteamManager.open();
    await GameManager.restoreGameFolder();
    await GameManager.clean();
    await GameManager.play(videoBackground);
  }
}

const startManager = new Start();
module.exports = startManager;
