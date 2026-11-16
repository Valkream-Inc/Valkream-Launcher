/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { ipcMain } from "electron";

import type { ValheimBaseMod } from "@shared/types";

import ValheimInstall from "./handlers/Valheim/Valheim-install";
import ValheimUpdate from "./handlers/Valheim/Valheim-update";
import ValheimStart from "./handlers/Valheim/Valheim-start";
import ValheimCustomMods from "./handlers/Valheim/Valheim-custom-mods";
import ValheimInstallationStatut from "./handlers/Valheim/Valheim-installation-statut";
import ValheimModsData from "./handlers/Valheim/Valheim-mods-data";

import ValheimGameManager from "../manager/Valheim/ValheimGameManager";
import ValheimVersionManager from "../manager/Valheim/ValheimVersionManager";

function ValheimIpcHandlers(): void {
  // infos
  ipcMain.handle(
    "Valheim-get-version:game",
    async () => (await ValheimVersionManager.getLocalVersionConfig())!.version
  );
  ipcMain.handle(
    "Valheim-get-installation-statut",
    async () => await ValheimInstallationStatut()
  );

  // utils
  ipcMain.handle(
    "Valheim-open-game-folder",
    async () => await ValheimGameManager.openFolder()
  );
  ipcMain.handle(
    "Valheim-uninstall-game",
    async () => await ValheimGameManager.uninstall()
  );

  // mods data
  ipcMain.handle("Valheim-get-mods-data", async (event, signal?: AbortSignal) => {
    return await ValheimModsData.getModsData(signal);
  });
  ipcMain.handle("Valheim-get-mods-details", async (event, baseMod: ValheimBaseMod) => {
    return await ValheimModsData.getModDetails(baseMod);
  });
  ipcMain.handle("Valheim-get-hash-data", async () => {
    return await ValheimVersionManager.getHash();
  });

  // installation / start / update / custom mods
  ipcMain.handle(
    "Valheim-install",
    async (event) => await ValheimInstall(event)
  );
  ipcMain.handle("Valheim-start", async (event) => await ValheimStart(event));
  ipcMain.handle("Valheim-update", async (event) => await ValheimUpdate(event));
  ipcMain.handle(
    "Valheim-custom-mods",
    async (event) => await ValheimCustomMods(event)
  );
}

export default ValheimIpcHandlers;
