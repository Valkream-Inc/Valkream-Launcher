/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { ipcMain, app, dialog } = require("electron");
const path = require("path");
const dev = process.env.NODE_ENV === "dev" || process.env.DEV_TOOL === "open";

const CheckForUpdates = require("./handlers/check-for-updates.js");
const DowloadMultiplefiles = require("./handlers/download-multiple-zips.js");
const MultipleUnzip = require("./handlers/multiple-unzip.js");
const ServerInfos = require("./handlers/server-info.js");

const MainWindow = require("../windows/mainWindow.js");
const UpdateWindow = require("../windows/updateWindow.js");

class IpcHandlers {
  init() {
    // update  windows
    ipcMain.on("update-window-close", () => UpdateWindow.destroyWindow());

    // main windows
    ipcMain.on("main-window-open", () => MainWindow.createWindow());
    ipcMain.on("main-window-close", () => MainWindow.destroyWindow());
    ipcMain.on("main-window-reload", () => MainWindow.getWindow().reload());
    ipcMain.on("main-window-minimize", () => MainWindow.getWindow().minimize());
    ipcMain.on("main-window-hide", () => MainWindow.getWindow().hide());
    ipcMain.on("main-window-show", () => MainWindow.getWindow().show());
    ipcMain.handle("main-window-restart", () => {
      app.relaunch();
      app.exit(0);
    });
    ipcMain.on("main-window-maximize", () => {
      if (MainWindow.getWindow().isMaximized()) {
        MainWindow.getWindow().unmaximize();
      } else {
        MainWindow.getWindow().maximize();
      }
    });
    ipcMain.on("main-window-open-devTools", () =>
      MainWindow.getWindow().webContents.openDevTools(/*{ mode: "detach" }*/)
    );

    // general
    ipcMain.handle("data-path", () =>
      path.join(
        dev ? app.getAppPath() : app.getPath("appData"),
        ".valkream-launcher-data"
      )
    );
    ipcMain.handle("get-installation-path", () => process.cwd());
    ipcMain.on("check-for-updates", (event) =>
      new CheckForUpdates(event).init()
    );
    ipcMain.on("app-quit", () => {
      app.quit();
      app.exit(0);
    });

    // zips
    ipcMain.handle(
      "download-multiple-files",
      async (event, files, id) =>
        await new DowloadMultiplefiles().init(event, files, id)
    );
    ipcMain.handle(
      "multiple-unzip",
      async (event, zips, id) => await new MultipleUnzip().init(event, zips, id)
    );

    // server infos
    ipcMain.on(
      "get-server-infos",
      async (event) => await new ServerInfos().init(event)
    );

    // Sélection dossier
    ipcMain.handle("choose-folder", async () => {
      const result = await dialog.showOpenDialog(MainWindow.getWindow(), {
        properties: ["openDirectory"],
        title: "Choisissez le dossier",
      });
      if (result.canceled || !result.filePaths.length) return null;
      return result.filePaths[0];
    });
  }
}

module.exports = IpcHandlers;
