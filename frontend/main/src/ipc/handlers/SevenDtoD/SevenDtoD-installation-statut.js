/**
 * @author Valkream Team
 * @license MIT-NC
 */

const InfosManager = require("../../../manager/infosManager");
const SevenDtoDHashManager = require("../../../manager/SevenDtoD/SevenDtoDHashManager");
const SecenDtoDSteamManager = require("../../../manager/SevenDtoD/SevenDtoDSteamManager");

async function SevenDtoD_InstallationStatut() {
  const [isServerReachable, isInternetConnected] = await Promise.all([
    InfosManager.getIsServerReachable(undefined, true),
    InfosManager.getIsInternetConnected(undefined, true),
  ]);

  await Promise.all([
    await SevenDtoDHashManager.getLocalHash(),
    await SevenDtoDHashManager.getOnlineHash(true),
  ]);

  const [isInstalled, isUpToDate, isAValidSteamGamePath] = await Promise.all([
    SevenDtoDHashManager.getIsInstalled(),
    SevenDtoDHashManager.getIsUpToDate(),
    SecenDtoDSteamManager.getIsAValidSteamGamePath(),
  ]);

  return {
    isInternetConnected,
    isServerReachable,
    isInstalled,
    isUpToDate,
    isAValidSteamGamePath,
  };
}

module.exports = SevenDtoD_InstallationStatut;
