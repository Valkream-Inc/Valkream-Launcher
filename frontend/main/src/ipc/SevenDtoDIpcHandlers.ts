/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { ipcMain } from "electron";

import SevenDtoD_ModsDataHandler from "./handlers/SevenDtoD/SevenDtoD-mods-data";
import SevenDtoD_InstallationStatut from "./handlers/SevenDtoD/SevenDtoD-installation-statut";
import SevenDtoD_Install from "./handlers/SevenDtoD/SevenDtoD-install";
import SevenDtoD_Play from "./handlers/SevenDtoD/SevenDtoD-play";
import SevenDtoD_Update from "./handlers/SevenDtoD/SevenDtoD-update";
import SevenDtoD_FixMods from "./handlers/SevenDtoD/SevenDtoD-fix-mods";

import SevenDtoDHachManager from "../manager/SevenDtoD/SevenDtoDHashManager";
import SevenDtoDGameManager from "../manager/SevenDtoD/SevenDtoDGameManager";

function SevenDtoDIpcHandlers(): void {
  // infos
  ipcMain.handle(
    "SevenDtoD-get-installation-statut",
    async () => await SevenDtoD_InstallationStatut()
  );

  // utils
  ipcMain.handle(
    "SevenDtoD-open-game-folder",
    async () => await SevenDtoDGameManager.openFolder()
  );
  ipcMain.handle(
    "SevenDtoD-uninstall-game",
    async () => await SevenDtoDGameManager.uninstall()
  );

  // mods data
  ipcMain.handle("SevenDtoD-get-mods-data", async (event) => {
    return await SevenDtoD_ModsDataHandler(event);
  });
  ipcMain.handle("SevenDtoD-get-local-hash-data", async () => {
    return JSON.stringify(await SevenDtoDHachManager.getLocalHash(), null, 2);
  });
  ipcMain.handle(
    "SevenDtoD-fix-mods",
    async (event) => await SevenDtoD_FixMods(event)
  );

  // installation / start / update
  ipcMain.handle(
    "SevenDtoD-install",
    async (event) => await SevenDtoD_Install(event)
  );
  ipcMain.handle(
    "SevenDtoD-play",
    async () => await SevenDtoD_Play()
  );
  ipcMain.handle(
    "SevenDtoD-update",
    async (event) => await SevenDtoD_Update(event)
  );
}

export default SevenDtoDIpcHandlers;
