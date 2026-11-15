/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { IpcMainInvokeEvent } from "electron";
import type { ActionResult } from "@shared/types";

import { formatBytes } from "../../../utils/function/formatBytes";

import SevenDtoDModsManager from "../../../manager/SevenDtoD/SevenDtoDModsManager";
import SevenDtoDHashManager from "../../../manager/SevenDtoD/SevenDtoDHashManager";
import SevenDtoDVersionManager from "../../../manager/SevenDtoD/SevenDtoDVersionManager";

async function SevenDtoD_Update(
  event: IpcMainInvokeEvent
): Promise<ActionResult> {
  // Les octets sont optionnels : `update` appelle parfois le callback avec le texte seul.
  const callback = (
    text: string,
    processedBytes?: number,
    totalBytes?: number,
    percent?: number,
    speed?: number
  ) => {
    event.sender.send("progress-update-SevenDtoD", {
      text,
      processedBytes: formatBytes(processedBytes as number),
      totalBytes: formatBytes(totalBytes as number),
      percent,
      speed: formatBytes(speed as number),
    });
  };

  try {
    await SevenDtoDModsManager.update(callback);

    await SevenDtoDHashManager.getLocalHash(true, callback);
    await SevenDtoDVersionManager.updateLocalVersionConfig();

    await event.sender.send("done-update-SevenDtoD");
    return { success: true };
  } catch (err) {
    console.error(err);
    event.sender.send("error-update-SevenDtoD", { message: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}

export default SevenDtoD_Update;
