/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const SettingsManager = require("../../manager/settingsManager");
const GameManager = require("../../manager/gameManager");
const ThunderstoreManager = require("../../manager/thunderstoreManager");
const VersionManager = require("../../manager/versionManager");
const InfosManager = require("../../manager/infosManager");

class InstallationStatut {
  async get() {
    // --- 1. Connectivité ---
    const [isServerReachable, isInternetConnected] = await Promise.all([
      InfosManager.getIsServerReachable(),
      InfosManager.getIsInternetConnected(),
    ]);

    // --- 2. Infos locales & installation ---
    const [
      localVersionConfig,
      gameInstalled,
      thunderInstalled,
      versionInstalled,
    ] = await Promise.all([
      VersionManager.getLocalVersionConfig(),
      GameManager.getIsInstalled(),
      ThunderstoreManager.getIsInstalled(),
      VersionManager.getIsInstalled(),
    ]);

    const isInstalled = gameInstalled && thunderInstalled && versionInstalled;

    // --- 3. Gestion des mods ---
    const checkCustomMods = async (mods, settingKey) => {
      const active = await SettingsManager.getSetting(settingKey);
      const installed = await ThunderstoreManager.isCustomModsInstalled(mods);
      const available = ThunderstoreManager.isCustomModsAvailable(mods);

      return { active, installed, available };
    };

    const [adminModsResult, boostfpsModsResult] = await Promise.all([
      checkCustomMods(localVersionConfig?.modpack?.admin_mods, "adminEnabled"),
      checkCustomMods(
        localVersionConfig?.modpack?.boostfps_mods,
        "boostfpsEnabled"
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

    // --- 4. Vérification des versions ---
    let onlineVersionConfig = null;
    let isUpToDate = false;
    let isMajorUpdate = false;

    if (isServerReachable) {
      onlineVersionConfig = await VersionManager.updateOnlineVersionConfig(
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
    const isCustomModsToInstall =
      isAdminModsToInstall || isBoostfpsModsToInstall;

    const isAdminModsToUninstall =
      isInstalled && !isAdminModsActive && isAdminModsInstalled;
    const isBoostfpsModsToUninstall =
      isInstalled && !isBoostfpsModsActive && isBoostfpsModsInstalled;
    const isCustomModsToUninstall =
      isAdminModsToUninstall || isBoostfpsModsToUninstall;

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
}

module.exports = new InstallationStatut();
