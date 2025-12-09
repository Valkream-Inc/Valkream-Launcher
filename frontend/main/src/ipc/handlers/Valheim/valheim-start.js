/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const SettingsManager = require("../../../manager/settingsManager");

const ValheimSteamManager = require("../../../manager/Valheim/ValheimSteamManager");
const ValheimGameManager = require("../../../manager/Valheim/ValheimGameManager");

async function ValheimStart(event) {
  const launchSteam = await SettingsManager.getSetting(
    "launchSteamWithValheim"
  );

  if (launchSteam) await ValheimSteamManager.open();
  await ValheimGameManager.restoreGameFolder();
  await ValheimGameManager.clean();
  await ValheimGameManager.play();
  return;
}

module.exports = ValheimStart;
