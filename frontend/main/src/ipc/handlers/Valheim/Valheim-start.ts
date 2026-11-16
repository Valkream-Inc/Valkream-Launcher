/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { IpcMainInvokeEvent } from "electron";

import SettingsManager from "../../../manager/settingsManager";

import ValheimSteamManager from "../../../manager/Valheim/ValheimSteamManager";
import ValheimGameManager from "../../../manager/Valheim/ValheimGameManager";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function ValheimStart(event: IpcMainInvokeEvent) {
  const launchSteam = await SettingsManager.getSetting(
    "launchSteamWithValheim"
  );

  if (launchSteam) await ValheimSteamManager.open();
  await ValheimGameManager.restoreGameFolder();
  await ValheimGameManager.clean();
  await ValheimGameManager.play();
  return;
}

export default ValheimStart;
