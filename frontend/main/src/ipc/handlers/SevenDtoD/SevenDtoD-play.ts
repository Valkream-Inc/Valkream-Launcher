/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { IpcMainInvokeEvent } from "electron";

import SettingsManager from "../../../manager/settingsManager";

import SevenDtoDSteamManager from "../../../manager/SevenDtoD/SevenDtoDSteamManager";
import SevenDtoDGameManager from "../../../manager/SevenDtoD/SevenDtoDGameManager";

async function SevenDtoD_Play(_event: IpcMainInvokeEvent): Promise<void> {
  const launchSteam = await SettingsManager.getSetting(
    "launchSteamWithSevenDtoD",
  );

  if (launchSteam) await SevenDtoDSteamManager.open();
  await SevenDtoDGameManager.play();
  return;
}

export default SevenDtoD_Play;
