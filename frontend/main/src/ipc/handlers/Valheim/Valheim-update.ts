/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { IpcMainInvokeEvent } from "electron";
import type { ProgressCallback } from "@shared/types";

import { formatBytes } from "../../../utils/function/formatBytes";

import ValheimGameManager from "../../../manager/Valheim/ValheimGameManager";
import ValheimThunderstoreManager from "../../../manager/Valheim/ValheimThunderstoreManager";
import ValheimVersionManager from "../../../manager/Valheim/ValheimVersionManager";

async function ValheimUpdate(event: IpcMainInvokeEvent) {
  const callback: ProgressCallback = (text, processedBytes, totalBytes, percent, speed) => {
    event.sender.send("progress-update-Valheim", {
      text,
      processedBytes: formatBytes(processedBytes),
      totalBytes: formatBytes(totalBytes),
      percent,
      speed: formatBytes(speed),
    });
  };

  try {
    const onlineVersionConfig =
      await ValheimVersionManager.getOnlineVersionConfig();
    const localVersionConfig =
      await ValheimVersionManager.getLocalVersionConfig();

    const admin_mods = localVersionConfig?.modpack?.admin_mods;
    const boostfps_mods = localVersionConfig?.modpack?.boostfps_mods;

    if (
      onlineVersionConfig?.modpack?.gameFolderToPreserve ||
      admin_mods ||
      boostfps_mods
    ) {
      const gameFolderToPreserve = [
        ...(onlineVersionConfig?.modpack?.gameFolderToPreserve as string[]),
        ...(admin_mods as string[]).map((mod) => `/BepInEx/plugins/${mod}/`),
        ...(boostfps_mods as string[]).map((mod) => `/BepInEx/plugins/${mod}/`),
      ];

      await ValheimGameManager.preserveGameFolder(gameFolderToPreserve);
    }

    if (
      !localVersionConfig?.modpack?.version ||
      !onlineVersionConfig?.modpack?.version ||
      localVersionConfig?.modpack?.version !==
        onlineVersionConfig?.modpack?.version
    ) {
      // si la version du modpack thunderstore est différente de la version locale
      await ValheimThunderstoreManager.uninstallModpackConfig();
      await ValheimThunderstoreManager.downloadModpack(callback);
      await ValheimThunderstoreManager.unzipModpack(callback);
      await ValheimThunderstoreManager.finishModpack();
    }

    await ValheimThunderstoreManager.update(callback);
    if (onlineVersionConfig?.modpack?.gameFolderToRemove)
      await ValheimGameManager.clean(
        onlineVersionConfig?.modpack?.gameFolderToRemove
      );

    await ValheimGameManager.restoreGameFolder();
    await ValheimVersionManager.updateLocalVersionConfig();

    event.sender.send("done-update-Valheim");
    return { success: true };
  } catch (err) {
    console.error(err);
    event.sender.send("error-update-Valheim", {
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export default ValheimUpdate;
