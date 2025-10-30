/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const ThunderstoreManager = require("../../manager/thunderstoreManager");
const VersionManager = require("../../manager/versionManager");
const SettingsManager = require("../../manager/settingsManager");
const GameManager = require("../../manager/gameManager");
const InfosManager = require("../../manager/infosManager");

const { formatBytes } = require("../../utils/function/formatBytes");

class CustomMods {
  async action(event) {
    const callback = (text, processedBytes, totalBytes, percent, speed) => {
      event.sender.send("progress-custom-mods", {
        text,
        processedBytes: formatBytes(processedBytes),
        totalBytes: formatBytes(totalBytes),
        percent,
        speed: formatBytes(speed),
      });
    };

    try {
      // --- 1. Connectivité ---
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
        const active = await SettingsManager.getSetting(settingKey);
        const installed = await ThunderstoreManager.isCustomModsInstalled(mods);
        const available = ThunderstoreManager.isCustomModsAvailable(mods);

        return { active, installed, available };
      };

      // --- 4. Vérification des mods ---
      const admin_mods = localVersionConfig?.modpack?.admin_mods;
      const boostfps_mods = localVersionConfig?.modpack?.boostfps_mods;

      const [adminModsResult, boostfpsModsResult] = await Promise.all([
        checkCustomMods(admin_mods, "adminEnabled"),
        checkCustomMods(boostfps_mods, "boostfpsEnabled"),
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

      // cas 1.1: Admin mods gestion
      if (
        isInstalled &&
        isInternetConnected &&
        isAdminModsActive &&
        !isAdminModsInstalled &&
        isAdminModsAvailable
      ) {
        await ThunderstoreManager.InstallCustomMods(admin_mods, callback);
      } else if (isInstalled && !isAdminModsActive && isAdminModsInstalled) {
        callback("Désinstallation des mods admin...");
        await ThunderstoreManager.unInstallCustomMods(admin_mods);
      }

      // cas 1.2: BoostFPS mods gestion
      if (
        isInstalled &&
        isInternetConnected &&
        isBoostfpsModsActive &&
        !isBoostfpsModsInstalled &&
        isBoostfpsModsAvailable
      ) {
        await ThunderstoreManager.InstallCustomMods(
          boostfps_mods,
          this.callback
        );
      } else if (
        isInstalled &&
        !isBoostfpsModsActive &&
        isBoostfpsModsInstalled
      ) {
        callback("Désinstallation des mods pour booster les FPS...");
        await ThunderstoreManager.unInstallCustomMods(boostfps_mods);
      }

      event.sender.send("done-custom-mods");
      return { success: true };
    } catch (err) {
      console.error(err);
      event.sender.send("error-custom-mods", { message: err.message });
      throw err;
    }
  }
}

const customModsManager = new CustomMods();
module.exports = customModsManager;
