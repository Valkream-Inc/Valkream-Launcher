/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { IpcMainInvokeEvent } from "electron";
import type { ProgressCallback } from "@shared/types";
import type { SettingKey } from "@shared/types";
import type { ValheimCustomModsCheck } from "../../../types/valheim";

import { formatBytes } from "../../../utils/function/formatBytes";

import SettingsManager from "../../../manager/settingsManager";
import InfosManager from "../../../manager/infosManager";

import ValheimThunderstoreManager from "../../../manager/Valheim/ValheimThunderstoreManager";
import ValheimVersionManager from "../../../manager/Valheim/ValheimVersionManager";
import ValheimGameManager from "../../../manager/Valheim/ValheimGameManager";

async function ValheimCustomMods(event: IpcMainInvokeEvent) {
  const callback: ProgressCallback = (text, processedBytes, totalBytes, percent, speed) => {
    event.sender.send("progress-custom-mods-Valheim", {
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
      ValheimVersionManager.getLocalVersionConfig(),
      ValheimGameManager.getIsInstalled(),
      ValheimThunderstoreManager.getIsInstalled(),
      ValheimVersionManager.getIsInstalled(),
    ]);

    const isInstalled = gameInstalled && thunderInstalled && versionInstalled;

    // --- 3. Gestion des mods ---
    const checkCustomMods = async (
      mods: string[] | undefined,
      settingKey: SettingKey,
    ): Promise<ValheimCustomModsCheck> => {
      const active = await SettingsManager.getSetting(settingKey);
      const installed =
        await ValheimThunderstoreManager.isCustomModsInstalled(mods);
      const available = ValheimThunderstoreManager.isCustomModsAvailable(mods);

      return { active, installed, available };
    };

    // --- 4. Vérification des mods ---
    const admin_mods = localVersionConfig?.modpack?.admin_mods;
    const boostfps_mods = localVersionConfig?.modpack?.boostfps_mods;
    const boostgraphic_mods = localVersionConfig?.modpack?.boostgraphic_mods;

    const [adminModsResult, boostfpsModsResult, boostgraphicModsResult] =
      await Promise.all([
        checkCustomMods(admin_mods, "adminModsEnabledWithValheim"),
        checkCustomMods(boostfps_mods, "boostfpsModsEnabledWithValheim"),
        checkCustomMods(
          boostgraphic_mods,
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

    // cas 1.1: Admin mods gestion
    if (
      isInstalled &&
      isInternetConnected &&
      isAdminModsActive &&
      !isAdminModsInstalled &&
      isAdminModsAvailable
    ) {
      await ValheimThunderstoreManager.InstallCustomMods(admin_mods, callback);
    } else if (isInstalled && !isAdminModsActive && isAdminModsInstalled) {
      callback("Désinstallation des mods admin...");
      await ValheimThunderstoreManager.unInstallCustomMods(admin_mods);
    }

    // cas 1.2: BoostFPS mods gestion
    if (
      isInstalled &&
      isInternetConnected &&
      isBoostfpsModsActive &&
      !isBoostfpsModsInstalled &&
      isBoostfpsModsAvailable
    ) {
      await ValheimThunderstoreManager.InstallCustomMods(
        boostfps_mods,
        callback,
      );
    } else if (
      isInstalled &&
      !isBoostfpsModsActive &&
      isBoostfpsModsInstalled
    ) {
      callback("Désinstallation des mods pour booster les FPS...");
      await ValheimThunderstoreManager.unInstallCustomMods(boostfps_mods);
    }

    // cas 1.3: BoostGRAPHICS mods gestion
    if (
      isInstalled &&
      isInternetConnected &&
      isBoostgraphicModsActive &&
      !isBoostgraphicModsInstalled &&
      isBoostgraphicModsAvailable
    ) {
      await ValheimThunderstoreManager.InstallCustomMods(
        boostgraphic_mods,
        callback,
      );
    } else if (
      isInstalled &&
      !isBoostgraphicModsActive &&
      isBoostgraphicModsInstalled
    ) {
      callback("Désinstallation des mods pour booster les Graphiques ...");
      await ValheimThunderstoreManager.unInstallCustomMods(boostgraphic_mods);
    }

    event.sender.send("done-custom-mods-Valheim");
    return { success: true };
  } catch (err) {
    console.error(err);
    event.sender.send("error-custom-mods-Valheim", {
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export default ValheimCustomMods;
