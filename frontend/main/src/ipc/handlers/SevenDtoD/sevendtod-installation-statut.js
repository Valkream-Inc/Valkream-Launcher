/**
 * @author Valkream Team
 * @license MIT-NC
 */

const InfosManager = require("../../../manager/infosManager");

async function SevenDtoD_InstallationStatut() {
  const [isServerReachable, isInternetConnected] = await Promise.all([
    InfosManager.getIsServerReachable(undefined, true),
    InfosManager.getIsInternetConnected(undefined, true),
  ]);

  return {
    isInternetConnected,
    isServerReachable,
  };
}

module.exports = SevenDtoD_InstallationStatut;
