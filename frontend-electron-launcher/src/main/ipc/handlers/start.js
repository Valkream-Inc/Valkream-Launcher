const { SettingsManager, SteamManager, GameManager } = require("../../manager");

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
startManager.init();
module.exports = startManager;
