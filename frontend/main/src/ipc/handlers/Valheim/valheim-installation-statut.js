/**
 * @author Valkream Team
 * @license MIT-NC
 */

const SettingsManager = require("../../../manager/settingsManager");
const InfosManager = require("../../../manager/infosManager");

const ValheimGameManager = require("../../../manager/Valheim/ValheimGameManager");
const ValheimThunderstoreManager = require("../../../manager/Valheim/ValheimThunderstoreManager");
const ValheimVersionManager = require("../../../manager/Valheim/ValheimVersionManager");

async function ValheimInstallationStatut() {
  // --- 1. Connectivité ---
  const [isServerReachable, isInternetConnected] = await Promise.all([
    InfosManager.getIsServerReachable(undefined, true),
    InfosManager.getIsInternetConnected(undefined, true),
  ]);

  // --- 2. Infos locales & installation ---
  const [
    localVersionConfig,
    gameInstalled,
    thunderInstalled,
    versionInstalled,
  ] = await Promise.all([
    ValheimVersionManager.getLocalVersionConfig(),
    ValheimGameManager.getIsInstalled(),
    ValheimThunderstoreManager.getIsInstalled(),
    ValheimVersionManager.getIsInstalled(),
  ]);

  const isInstalled = gameInstalled && thunderInstalled && versionInstalled;

  // --- 3. Gestion des mods ---
  const checkCustomMods = async (mods, settingKey) => {
    const active = await SettingsManager.getSetting(settingKey);
    const installed = await ValheimThunderstoreManager.isCustomModsInstalled(
      mods
    );
    const available = ValheimThunderstoreManager.isCustomModsAvailable(mods);

    return { active, installed, available };
  };

  const [adminModsResult, boostfpsModsResult, boostgraphicModsResult] =
    await Promise.all([
      checkCustomMods(
        localVersionConfig?.modpack?.admin_mods,
        "adminModsEnabledWithValheim"
      ),
      checkCustomMods(
        localVersionConfig?.modpack?.boostfps_mods,
        "boostfpsModsEnabledWithValheim"
      ),
      checkCustomMods(
        localVersionConfig?.modpack?.boostgraphic_mods,
        "boostgraphicModsEnabledWithValheim"
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
  let onlineVersionConfig = null;
  let isUpToDate = false;
  let isMajorUpdate = false;

  if (isServerReachable) {
    onlineVersionConfig = await ValheimVersionManager.getOnlineVersionConfig(
      true
    );

    const majorLocal = parseInt(
      (localVersionConfig?.version ?? "0.0.0").split(".")[0],
      10
    );
    const majorOnline = parseInt(
      (onlineVersionConfig?.version ?? "0.0.0").split(".")[0],
      10
    );
    isMajorUpdate = majorLocal !== majorOnline;

    isUpToDate =
      localVersionConfig?.version &&
      onlineVersionConfig?.version &&
      localVersionConfig?.version === onlineVersionConfig?.version;
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

module.exports = ValheimInstallationStatut;
