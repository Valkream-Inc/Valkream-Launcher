/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { ipcMain } = require("electron");

const SevenDtoD_ModsDataHandler = require("./handlers/SevenDtoD/SevenDtoD-mods-data.js");
const SevenDtoD_InstallationStatut = require("./handlers/SevenDtoD/SevenDtoD-installation-statut.js");
const SevenDtoD_Install = require("./handlers/SevenDtoD/SevenDtoD-install.js");
const SevenDtoD_Play = require("./handlers/SevenDtoD/SevenDtoD-play.js");
const SevenDtoD_Update = require("./handlers/SevenDtoD/SevenDtoD-update.js");
const SevenDtoDHachManager = require("../manager/SevenDtoD/SevenDtoDHashManager.js");
const SevenDtoDSteamManager = require("../manager/SevenDtoD/SevenDtoDSteamManager.js");
const SevenDtoDGameManager = require("../manager/SevenDtoD/SevenDtoDGameManager.js");

function SevenDtoDIpcHandlers() {
  // infos
  ipcMain.handle(
    "SevenDtoD-get-installation-statut",
    async () => await SevenDtoD_InstallationStatut()
  );
  ipcMain.handle(
    "SevenDtoD-test-is-steam-game-path-valid",
    async (event, path) => await SevenDtoDSteamManager.testSteamGamePath(path)
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

  // installation / start / update / custom mods
  ipcMain.handle(
    "SevenDtoD-install",
    async (event) => await SevenDtoD_Install(event)
  );
  ipcMain.handle(
    "SevenDtoD-play",
    async (event) => await SevenDtoD_Play(event)
  );
  ipcMain.handle(
    "SevenDtoD-update",
    async (event) => await SevenDtoD_Update(event)
  );
}

module.exports = SevenDtoDIpcHandlers;
