/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { ipcMain, app, dialog } = require("electron");

const CheckForUpdates = require("./handlers/check-for-updates.js");
const CheckInfos = require("./handlers/check-infos.js");
const Install = require("./handlers/install.js");
const Update = require("./handlers/update.js");
const Start = require("./handlers/start.js");
const CustomMods = require("./handlers/custom-mods.js");
const Reload = require("./handlers/reload.js");
const InstallationStatut = require("./handlers/installation-statut.js");

const SettingsManager = require("../manager/settingsManager");
const LauncherManager = require("../manager/launcherManager");
const GameManager = require("../manager/gameManager");

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
    ipcMain.on("check-for-updates", (event) =>
      new CheckForUpdates().init(event)
    );
    ipcMain.on("app-quit", () => {
      app.quit();
      app.exit(0);
    });

    // infos
    ipcMain.handle("check-infos", async (event, processId) => {
      await CheckInfos.init(event.sender, processId);
      return true;
    });
    ipcMain.handle("get-infos", async () => {
      return await CheckInfos.getInfos();
    });
    ipcMain.on("stop-check-infos", () => {
      CheckInfos.stop();
    });

    // installation
    ipcMain.handle(
      "install",
      async (event, date) => await new Install().init(event, date)
    );
    ipcMain.handle(
      "update",
      async (event, date) => await new Update().init(event, date)
    );
    ipcMain.handle(
      "start",
      async (event, videoBackground) => await new Start().init(videoBackground)
    );
    ipcMain.handle(
      "custom-mods-install",
      async (event, date, mods) =>
        await new CustomMods().install(event, date, mods)
    );
    ipcMain.handle(
      "custom-mods-uninstall",
      async (event, mods) => await new CustomMods().uninstall(mods)
    );
    ipcMain.handle("reload", async () => await Reload.init());
    ipcMain.handle("get-installation-statut", async () => {
      return await InstallationStatut.get();
    });
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
      "get-version",
      async () => await LauncherManager.getVersion()
    );
    ipcMain.handle("init", async () => await GameManager.init());

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
