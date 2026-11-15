/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { SevenDtoDInstallationStatut } from "@shared/types";

import InfosManager from "../../../manager/infosManager";
import SevenDtoDGameManager from "../../../manager/SevenDtoD/SevenDtoDGameManager";
import SevenDtoDHashManager from "../../../manager/SevenDtoD/SevenDtoDHashManager";
import SevenDtoDVersionManager from "../../../manager/SevenDtoD/SevenDtoDVersionManager";

async function SevenDtoD_InstallationStatut(): Promise<SevenDtoDInstallationStatut> {
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

export default SevenDtoD_InstallationStatut;
