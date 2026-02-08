/**
 * @author Valkream Team
 * @license MIT-NC
 */

const InfosManager = require("../../../manager/infosManager");
const SevenDtoDGameManager = require("../../../manager/SevenDtoD/SevenDtoDGameManager");
const SevenDtoDHashManager = require("../../../manager/SevenDtoD/SevenDtoDHashManager");
const SevenDtoDVersionManager = require("../../../manager/SevenDtoD/SevenDtoDVersionManager");

async function SevenDtoD_InstallationStatut() {
  const [isServerReachable, isInternetConnected] = await Promise.all([
    InfosManager.getIsServerReachable(undefined, true),
    InfosManager.getIsInternetConnected(undefined, true),
  ]);

  await SevenDtoDHashManager.getLocalHash();
  await SevenDtoDVersionManager.getOnlineVersionConfig(true);

  const [isHashInstalled, isGameInstalled, isVersionInstalled] =
    await Promise.all([
      SevenDtoDHashManager.getIsInstalled(),
      SevenDtoDGameManager.getIsInstalled(),
      SevenDtoDVersionManager.getIsInstalled(),
    ]);

  const isInstalled = isGameInstalled && isHashInstalled && isVersionInstalled;

  const [isUpToDate, isMajorUpdate, gameVersion] = await Promise.all([
    SevenDtoDVersionManager.isUpToDate(),
    SevenDtoDVersionManager.isMajorUpdate(),
    SevenDtoDVersionManager.getLocalVersion(),
  ]);

  if (!isUpToDate) await SevenDtoDHashManager.getOnlineHash(true);

  return {
    isServerReachable,
    isInternetConnected,
    isInstalled,
    isUpToDate,
    isMajorUpdate,
    gameVersion,
  };
}

module.exports = SevenDtoD_InstallationStatut;
