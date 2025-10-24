const SettingsManager = require("../../manager/settingsManager");
const SteamManager = require("../../manager/steamManager");
const GameManager = require("../../manager/gameManager");

class Start {
  async init(event) {
    const launchSteam = await SettingsManager.getSetting("launchSteam");

    if (launchSteam) await SteamManager.open();
    await GameManager.restoreGameFolder();
    await GameManager.clean();
    await GameManager.play();
    return;
  }
}

const startManager = new Start();
module.exports = startManager;
