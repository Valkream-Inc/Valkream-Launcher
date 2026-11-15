/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { IpcMainInvokeEvent } from "electron";
import type { ActionResult } from "@shared/types";

import { formatBytes } from "../../../utils/function/formatBytes";

import SevenDtoDGameManager from "../../../manager/SevenDtoD/SevenDtoDGameManager";
import SevenDtoDModsManager from "../../../manager/SevenDtoD/SevenDtoDModsManager";
import SevenDtoDHashManager from "../../../manager/SevenDtoD/SevenDtoDHashManager";
import SevenDtoDVersionManager from "../../../manager/SevenDtoD/SevenDtoDVersionManager";

async function SevenDtoD_Install(
  event: IpcMainInvokeEvent
): Promise<ActionResult> {
  const callback = (
    text: string,
    processedBytes: number,
    totalBytes: number,
    percent: number,
    speed: number
  ) => {
    event.sender.send("progress-install-SevenDtoD", {
      text,
      processedBytes: formatBytes(processedBytes),
      totalBytes: formatBytes(totalBytes),
      percent,
      speed: formatBytes(speed),
    });
  };

  try {
    await SevenDtoDGameManager.uninstall();

    await SevenDtoDGameManager.dowloadGame(callback);
    await SevenDtoDGameManager.unzipGame(callback);
    await SevenDtoDGameManager.finishGame();

    await SevenDtoDModsManager.install(callback);

    await SevenDtoDHashManager.getLocalHash(true, callback);
    await SevenDtoDVersionManager.updateLocalVersionConfig();

    await event.sender.send("done-install-SevenDtoD");
    return { success: true };
  } catch (err) {
    console.error(err);
    event.sender.send("error-install-SevenDtoD", { message: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}

export default SevenDtoD_Install;
