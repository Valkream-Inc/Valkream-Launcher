/**
 * @author Valkream Team
 * @license MIT-NC
 */

const InfosManager = require("../../../manager/infosManager");
const SevenDtoDHashManager = require("../../../manager/SevenDtoD/SevenDtoDHashManager");

async function SevenDtoD_InstallationStatut() {
  await SevenDtoDHashManager.getLocalHash();

  const [isServerReachable, isInternetConnected, isInstalled, isUpToDate] =
    await Promise.all([
      InfosManager.getIsServerReachable(undefined, true),
      InfosManager.getIsInternetConnected(undefined, true),
      SevenDtoDHashManager.getIsInstalled(),
      SevenDtoDHashManager.getIsUpToDate(),
    ]);

  return {
    isInternetConnected,
    isServerReachable,
    isInstalled,
    isUpToDate,
  };
}

module.exports = SevenDtoD_InstallationStatut;
