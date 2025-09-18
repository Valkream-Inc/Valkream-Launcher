const SettingsManager = require("../../manager/settingsManager");
const SteamManager = require("../../manager/steamManager");
const GameManager = require("../../manager/gameManager");

class Start {
  async init(event) {
    const launchSteam = await SettingsManager.getSetting("launchSteam");

    const onExit = async () => {
      event.sender.send("game-exit");
    };

    if (launchSteam) await SteamManager.open();
    await GameManager.restoreGameFolder();
    await GameManager.clean();
    await GameManager.play(onExit);
    return await SettingsManager.getSetting("launcherBehavior");
  }
}

const startManager = new Start();
module.exports = startManager;
