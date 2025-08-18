const SettingsManager = require("../../manager/settingsManager");
const GameManager = require("../../manager/gameManager");
const ThunderstoreManager = require("../../manager/thunderstoreManager");
const VersionManager = require("../../manager/versionManager");

const CheckInfos = require("./check-infos");

class InstallationStatut {
  get = async () => {
    // --- 1. Connectivité ---
    const { isServerReachable, isInternetConnected } =
      await CheckInfos.getInfos();

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
    function checkCustomMods(mods, settingKey) {
      const active = SettingsManager.getSetting(settingKey);
      const installed = ThunderstoreManager.isCustomModsInstalled(mods);
      const available = ThunderstoreManager.isCustomModsAvailable(mods);
      return {
        active,
        installed,
        available,
        mods: active && installed ? mods ?? [] : [],
      };
    }

    const {
      active: isAdminModsActive,
      installed: isAdminModsInstalled,
      available: isAdminModsAvailable,
      mods: adminMods,
    } = checkCustomMods(
      localVersionConfig?.modpack?.admin_mods,
      "adminEnabled"
    );

    const {
      active: isBoostfpsModsActive,
      installed: isBoostfpsModsInstalled,
      available: isBoostfpsModsAvailable,
      mods: boostfpsMods,
    } = checkCustomMods(
      localVersionConfig?.modpack?.boostfps_mods,
      "boostfpsEnabled"
    );

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
        localVersionConfig?.version &&
        onlineVersionConfig?.version &&
        localVersionConfig.version === onlineVersionConfig.version;
    }

    // --- 5. Résultats ---
    return {
      isInternetConnected,
      isServerReachable,
      isInstalled,
      isAdminModsActive,
      isAdminModsInstalled,
      isAdminModsAvailable,
      adminMods,
      isBoostfpsModsActive,
      isBoostfpsModsInstalled,
      isBoostfpsModsAvailable,
      boostfpsMods,
      isUpToDate,
      isMajorUpdate,
    };
  };
}

const installationStatut = new InstallationStatut();
module.exports = installationStatut;
