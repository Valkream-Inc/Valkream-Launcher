/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { BooleanSettingKey, ValheimInstallationStatut } from "@shared/types";
import type { ValheimCustomModsCheck } from "../../../types/valheim";

import SettingsManager from "../../../manager/settingsManager";
import InfosManager from "../../../manager/infosManager";

import ValheimGameManager from "../../../manager/Valheim/ValheimGameManager";
import ValheimThunderstoreManager from "../../../manager/Valheim/ValheimThunderstoreManager";
import ValheimVersionManager from "../../../manager/Valheim/ValheimVersionManager";

async function ValheimInstallationStatut(): Promise<ValheimInstallationStatut> {
  // --- 1. Connectivité ---
  const [isServerReachable, isInternetConnected] = await Promise.all([
    InfosManager.getIsServerReachable(undefined, true),
    InfosManager.getIsInternetConnected(undefined, true),
  ]);

  // --- 2. Infos locales & installation ---
  const onlineVersionConfig =
    await ValheimVersionManager.getOnlineVersionConfig(true);

  const [
    localVersionConfig,
    gameInstalled,
    thunderInstalled,
    versionInstalled,
  ] = await Promise.all([
    ValheimVersionManager.getLocalVersionConfig(true),
    ValheimGameManager.getIsInstalled(),
    ValheimThunderstoreManager.getIsInstalled(),
    ValheimVersionManager.getIsInstalled(),
  ]);

  const isInstalled = gameInstalled && thunderInstalled && versionInstalled;

  // --- 3. Gestion des mods ---
  const checkCustomMods = async (
    mods: string[] | undefined,
    settingKey: BooleanSettingKey,
  ): Promise<ValheimCustomModsCheck> => {
    const active = await SettingsManager.getSetting(settingKey);
    const installed =
      await ValheimThunderstoreManager.isCustomModsInstalled(mods);
    const available = ValheimThunderstoreManager.isCustomModsAvailable(mods);

    return { active, installed, available };
  };

  const [adminModsResult, boostfpsModsResult, boostgraphicModsResult] =
    await Promise.all([
      checkCustomMods(
        localVersionConfig?.modpack?.admin_mods,
        "adminModsEnabledWithValheim",
      ),
      checkCustomMods(
        localVersionConfig?.modpack?.boostfps_mods,
        "boostfpsModsEnabledWithValheim",
      ),
      checkCustomMods(
        localVersionConfig?.modpack?.boostgraphic_mods,
        "boostgraphicModsEnabledWithValheim",
      ),
    ]);

  const {
    active: isAdminModsActive,
    installed: isAdminModsInstalled,
    available: isAdminModsAvailable,
  } = adminModsResult;

  const {
    active: isBoostfpsModsActive,
    installed: isBoostfpsModsInstalled,
    available: isBoostfpsModsAvailable,
  } = boostfpsModsResult;

  const {
    active: isBoostgraphicModsActive,
    installed: isBoostgraphicModsInstalled,
    available: isBoostgraphicModsAvailable,
  } = boostgraphicModsResult;

  // --- 4. Vérification des versions ---
  let isUpToDate = false;
  let isMajorUpdate = false;

  if (isServerReachable) {
    const majorLocal = (localVersionConfig?.version ?? "0.0.0").split(".")[0];
    const majorOnline = (onlineVersionConfig?.version ?? "0.0.0").split(".")[0];
    isMajorUpdate = majorLocal !== majorOnline;

    isUpToDate = Boolean(
      localVersionConfig?.version &&
        onlineVersionConfig?.version &&
        localVersionConfig?.version === onlineVersionConfig?.version
    );
  }

  const gameVersion = isInstalled ? localVersionConfig?.version : null;

  const isAdminModsToInstall =
    isInstalled &&
    isInternetConnected &&
    isAdminModsActive &&
    !isAdminModsInstalled &&
    isAdminModsAvailable;
  const isBoostfpsModsToInstall =
    isInstalled &&
    isInternetConnected &&
    isBoostfpsModsActive &&
    !isBoostfpsModsInstalled &&
    isBoostfpsModsAvailable;
  const isBoostgraphicModsToInstall =
    isInstalled &&
    isInternetConnected &&
    isBoostgraphicModsActive &&
    !isBoostgraphicModsInstalled &&
    isBoostgraphicModsAvailable;
  // mods a installer ?
  const isCustomModsToInstall =
    isAdminModsToInstall ||
    isBoostfpsModsToInstall ||
    isBoostgraphicModsToInstall;

  const isAdminModsToUninstall =
    isInstalled && !isAdminModsActive && isAdminModsInstalled;
  const isBoostfpsModsToUninstall =
    isInstalled && !isBoostfpsModsActive && isBoostfpsModsInstalled;
  const isBoostgraphicModsToUninstall =
    isInstalled && !isBoostgraphicModsActive && isBoostgraphicModsInstalled;
  //mods a déinstaller
  const isCustomModsToUninstall =
    isAdminModsToUninstall ||
    isBoostfpsModsToUninstall ||
    isBoostgraphicModsToUninstall;

  // --- 5. Résultats ---
  return {
    isInternetConnected,
    isServerReachable,
    isInstalled,
    isUpToDate,
    isMajorUpdate,
    gameVersion,

    // Résultats des mods
    isAdminModsActive,
    isCustomModsToInstall,
    isCustomModsToUninstall,
  };
}

export default ValheimInstallationStatut;
