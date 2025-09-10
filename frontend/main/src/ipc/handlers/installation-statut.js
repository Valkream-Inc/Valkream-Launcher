const SettingsManager = require("../../manager/settingsManager");
const GameManager = require("../../manager/gameManager");
const ThunderstoreManager = require("../../manager/thunderstoreManager");
const VersionManager = require("../../manager/versionManager");

const CheckInfos = require("./check-infos");
const InfosManager = require("../../manager/infosManager");

class InstallationStatut {
  get = async () => {
    console.log("get");
    // --- 1. Connectivité ---
    const isServerReachable = await InfosManager.getIsServerReachable();
    const isInternetConnected = await InfosManager.getIsInternetConnected();

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
      const [active] = await Promise.all([
        SettingsManager.getSetting(settingKey),
      ]);

      const installed = ThunderstoreManager.isCustomModsInstalled(mods);
      const available = ThunderstoreManager.isCustomModsAvailable(mods);

      return {
        active,
        installed,
        available,
      };
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
      onlineVersionConfig = await VersionManager.getOnlineVersionConfig();

      const [majorLocal] = (localVersionConfig?.version ?? "0.0.0").split(".");
      const [majorOnline] = (onlineVersionConfig?.version ?? "0.0.0").split(
        "."
      );
      isMajorUpdate = majorLocal !== majorOnline;

      isUpToDate =
        !!localVersionConfig?.version &&
        localVersionConfig.version === onlineVersionConfig?.version;
    }

    // --- 5. Résultats ---
    return {
      isInternetConnected,
      isServerReachable,
      isInstalled,
      isUpToDate,
      isMajorUpdate,

      // Résultats des mods
      isAdminModsActive,
      isAdminModsInstalled,
      isAdminModsAvailable,

      isBoostfpsModsActive,
      isBoostfpsModsInstalled,
      isBoostfpsModsAvailable,
    };
  };
}

const installationStatut = new InstallationStatut();
module.exports = installationStatut;
