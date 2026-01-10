/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { ipcMain, app, dialog, shell } = require("electron");

const CheckForUpdates = require("./handlers/check-for-updates.js");
const CheckInfos = require("./handlers/check-infos.js");

const SettingsManager = require("../manager/settingsManager.js");
const LauncherManager = require("../manager/launcherManager.js");

const MainWindow = require("../windows/mainWindow.js");
const UpdateWindow = require("../windows/updateWindow.js");

const ValheimIpcHandlers = require("./ValheimIpcHandlers.js");
const SevenDtoDIpcHandlers = require("./SevenDtoDIpcHandlers.js");

class IpcHandlers {
  async openAppData() {
    const path = require("path");
    const fs = require("fs");

    const appDataPath = path.join(app.getPath("appData"));
    const valkreamLauncherPath = path.join(appDataPath, "Valkream-Launcher");

    if (fs.existsSync(valkreamLauncherPath))
      return await shell.openPath(valkreamLauncherPath);
    else throw new Error("Le dossier AppData n'existe pas !");
  }

  async openLink(event, url = "") {
    if (
      !(
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("steam://")
      )
    )
      throw new Error("URL invalide");
    await shell.openExternal(url);
  }

  async choseFolder() {
    const result = await dialog.showOpenDialog(MainWindow.getWindow(), {
      properties: ["openDirectory"],
      title: "Choisissez le dossier",
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
  }

  /* Main Fucntions */
  init() {
    // games ipc
    ValheimIpcHandlers();
    SevenDtoDIpcHandlers();

    // update  windows
    ipcMain.on("update-window-close", () => UpdateWindow.destroyWindow());
    ipcMain.on("check-for-updates", (event) =>
      new CheckForUpdates().init(event)
    );

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
    ipcMain.on("app-quit", () => {
      app.quit();
      app.exit(0);
    });

    // infos
    ipcMain.handle("get-version:launcher", () => LauncherManager.getVersion());
    ipcMain.handle("get-infos", async (event, game) => await CheckInfos(game));

    // utils
    ipcMain.handle("open-link", this.openLink.bind(this));
    ipcMain.handle(
      "get-settings",
      async (event, setting) => await SettingsManager.getSetting(setting)
    );
    ipcMain.handle(
      "set-settings",
      async (event, setting, value) =>
        await SettingsManager.setSetting(setting, value)
    );
    ipcMain.handle(
      "main-window-open-devTools",
      async () =>
        await MainWindow.getWindow().webContents.openDevTools(/*{ mode: "detach" }*/)
    );
    ipcMain.handle("open-appdata", this.openAppData.bind(this));
    ipcMain.handle(
      "uninstall-launcher",
      async () => await LauncherManager.uninstall()
    );

    // Sélection dossier
    ipcMain.handle("choose-folder", this.choseFolder.bind(this));
  }
}

module.exports = IpcHandlers;
