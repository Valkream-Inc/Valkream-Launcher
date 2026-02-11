/**
 * @author Valkream Team
 * @license MIT-NC
 */

const SettingsManager = require("../../../manager/settingsManager");

const SevenDtoDSteamManager = require("../../../manager/SevenDtoD/SevenDtoDSteamManager");
const SevenDtoDGameManager = require("../../../manager/SevenDtoD/SevenDtoDGameManager");

async function SevenDtoD_Play(event) {
  const launchSteam = await SettingsManager.getSetting(
    "launchSteamWithSevenDtoD",
  );

  if (launchSteam) await SevenDtoDSteamManager.open();
  await SevenDtoDGameManager.play();
  return;
}

module.exports = SevenDtoD_Play;
