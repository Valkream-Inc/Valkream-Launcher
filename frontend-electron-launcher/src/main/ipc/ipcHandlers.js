const { ipcMain, app } = require("electron");
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

    // general
    ipcMain.handle("data-path", () =>
      path.join(
        dev ? app.getAppPath() : app.getPath("appData"),
        ".valkream-launcher-data"
      )
    );
    ipcMain.handle("get-installation-path", () => app.getAppPath());
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
      async (event, files) =>
        await new DowloadMultiplefiles().init(event, files)
    );
    ipcMain.handle(
      "multiple-unzip",
      async (event, zips) => await new MultipleUnzip().init(event, zips)
    );

    // server infos
    ipcMain.on(
      "get-server-infos",
      async (event) => await new ServerInfos().init(event)
    );
  }
}

module.exports = IpcHandlers;
