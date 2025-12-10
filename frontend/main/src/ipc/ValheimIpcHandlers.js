/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { ipcMain } = require("electron");

const ValheimInstall = require("./handlers/Valheim/valheim-install.js");
const ValheimUpdate = require("./handlers/Valheim/valheim-update.js");
const ValheimStart = require("./handlers/Valheim/valheim-start.js");
const ValheimCustomMods = require("./handlers/Valheim/valheim-custom-mods.js");
const ValheimInstallationStatut = require("./handlers/Valheim/valheim-installation-statut.js");
const ValheimModsData = require("./handlers/Valheim/valheim-mods-data.js");

const ValheimGameManager = require("../manager/Valheim/ValheimGameManager.js");
const ValheimVersionManager = require("../manager/Valheim/ValheimVersionManager.js");

function ValheimIpcHandlers() {
  // infos
  ipcMain.handle(
    "Valheim-get-version:game",
    async () => (await ValheimVersionManager.getLocalVersionConfig()).version
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
  ipcMain.handle("Valheim-get-mods-data", async (event, signal) => {
    return await ValheimModsData.getModsData(signal);
  });
  ipcMain.handle("Valheim-get-mods-details", async (event, baseMod) => {
    return await ValheimModsData.getModDetails(baseMod);
  });
  ipcMain.handle("Valheim-get-hash-data", async (event) => {
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

module.exports = ValheimIpcHandlers;
