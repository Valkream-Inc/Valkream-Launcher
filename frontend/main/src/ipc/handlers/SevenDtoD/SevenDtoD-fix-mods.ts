/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { IpcMainInvokeEvent } from "electron";
import type { ActionResult } from "@shared/types";

import SevenDtoDModsManager from "../../../manager/SevenDtoD/SevenDtoDModsManager";

async function SevenDtoD_FixMods(
  event: IpcMainInvokeEvent
): Promise<ActionResult> {
  const callback = (text: string) => {
    event.sender.send("progress-fix-mods-SevenDtoD", {
      text,
    });
  };

  try {
    await SevenDtoDModsManager.generateFix(callback);
    await event.sender.send("done-fix-mods-SevenDtoD");
    return { success: true };
  } catch (err) {
    console.error(err);
    event.sender.send("error-fix-mods-SevenDtoD", { message: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}

export default SevenDtoD_FixMods;
