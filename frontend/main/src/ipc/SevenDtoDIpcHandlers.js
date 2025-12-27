/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { ipcMain } = require("electron");

const SevenDtoD_ModsDataHandler = require("./handlers/SevenDtoD/sevendtod-mods-data.js");
const SevenDtoD_InstallationStatut = require("./handlers/SevenDtoD/sevendtod-installation-statut.js");
const SevenDtoDHachManager = require("../manager/SevenDtoD/SevenDtoDHashManager.js");

function SevenDtoDIpcHandlers() {
  // infos
  ipcMain.handle(
    "SevenDtoD-get-installation-statut",
    async () => await SevenDtoD_InstallationStatut()
  );
  // mods data
  ipcMain.handle("SevenDtoD-get-mods-data", async (event) => {
    return await SevenDtoD_ModsDataHandler(event);
  });
  ipcMain.handle("SevenDtoD-get-local-hash-data", async () => {
    return JSON.stringify(await SevenDtoDHachManager.getLocalHash(), null, 2);
  });
}

module.exports = SevenDtoDIpcHandlers;
