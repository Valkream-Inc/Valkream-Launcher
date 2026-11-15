/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { IpcMainInvokeEvent } from "electron";
import type { ProgressCallback } from "@shared/types";

import { formatBytes } from "../../../utils/function/formatBytes";

import ValheimVersionManager from "../../../manager/Valheim/ValheimVersionManager";
import ValheimThunderstoreManager from "../../../manager/Valheim/ValheimThunderstoreManager";
import ValheimGameManager from "../../../manager/Valheim/ValheimGameManager";

async function ValheimInstall(event: IpcMainInvokeEvent) {
  const callback: ProgressCallback = (text, processedBytes, totalBytes, percent, speed) => {
    event.sender.send("progress-install-Valheim", {
      text,
      processedBytes: formatBytes(processedBytes),
      totalBytes: formatBytes(totalBytes),
      percent,
      speed: formatBytes(speed),
    });
  };

  try {
    await ValheimGameManager.uninstall();

    await ValheimGameManager.dowloadGame(callback);
    await ValheimGameManager.unzipGame(callback);
    await ValheimGameManager.finishGame();

    await ValheimGameManager.dowloadBepInEx(callback);
    await ValheimGameManager.unzipBepInEx(callback);
    await ValheimGameManager.finishBepInEx();

    await ValheimThunderstoreManager.downloadModpack(callback);
    await ValheimThunderstoreManager.unzipModpack(callback);
    await ValheimThunderstoreManager.finishModpack();

    await ValheimThunderstoreManager.dowloadMods(callback);
    await ValheimThunderstoreManager.unzipMods(callback);
    await ValheimThunderstoreManager.finishMods();

    await ValheimVersionManager.updateLocalVersionConfig();

    event.sender.send("done-install-Valheim");
    return { success: true };
  } catch (err) {
    console.error(err);
    event.sender.send("error-install-Valheim", {
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

export default ValheimInstall;
