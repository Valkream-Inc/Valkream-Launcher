/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { ipcMain, app, dialog, shell } = require("electron");

const CheckForUpdates = require("./handlers/check-for-updates.js");
const CheckInfos = require("./handlers/check-infos.js");
const Install = require("./handlers/install.js");
const Update = require("./handlers/update.js");
const Start = require("./handlers/start.js");
const CustomMods = require("./handlers/custom-mods.js");
const InstallationStatut = require("./handlers/installation-statut.js");
const ModsDataHandler = require("./handlers/mods-data.js");

const SettingsManager = require("../manager/settingsManager.js");
const LauncherManager = require("../manager/launcherManager.js");
const GameManager = require("../manager/gameManager.js");
const VersionManager = require("../manager/versionManager.js");

const MainWindow = require("../windows/mainWindow.js");
const UpdateWindow = require("../windows/updateWindow.js");

const openAppData = async () => {
  const path = require("path");
  const fs = require("fs");

  const appDataPath = path.join(app.getPath("appData"));
  const valkreamLauncherPath = path.join(appDataPath, "Valkream-Launcher");

  if (fs.existsSync(valkreamLauncherPath))
    return await shell.openPath(valkreamLauncherPath);
  else throw new Error("Le dossier AppData n'existe pas !");
};

class IpcHandlers {
  init() {
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
    ipcMain.handle(
      "get-version:game",
      async () => (await VersionManager.getLocalVersionConfig()).version
    );
    ipcMain.handle(
      "get-infos",
      async (event, game) => await CheckInfos.get(game)
    );
    ipcMain.handle(
      "get-installation-statut",
      async () => await InstallationStatut.get()
    );

    // utils
    ipcMain.handle("open-link", async (event, url) => {
      if (
        !(
          url.startsWith("http://") ||
          url.startsWith("https://") ||
          url.startsWith("steam://")
        )
      )
        throw new Error("URL invalide");
      await shell.openExternal(url);
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
      "main-window-open-devTools",
      async () =>
        await MainWindow.getWindow().webContents.openDevTools(/*{ mode: "detach" }*/)
    );
    ipcMain.handle("open-appdata", openAppData);
    ipcMain.handle(
      "open-game-folder",
      async () => await GameManager.openFolder()
    );
    ipcMain.handle("uninstall-game", async () => await GameManager.uninstall());
    ipcMain.handle(
      "uninstall-launcher",
      async () => await LauncherManager.uninstall()
    );

    // mods data
    ipcMain.handle("get-mods-data", async (event, signal) => {
      return await ModsDataHandler.getModsData(signal);
    });
    ipcMain.handle("get-mods-details", async (event, baseMod) => {
      return await ModsDataHandler.getModDetails(baseMod);
    });
    ipcMain.handle("get-hash-data", async (event) => {
      return await VersionManager.getHash();
    });

    // installation / start / update / custom mods
    ipcMain.handle("install", async (event) => await Install.init(event));
    ipcMain.handle("start", async (event) => await Start.init(event));
    ipcMain.handle("update", async (event) => await Update.init(event));
    ipcMain.handle(
      "custom-mods",
      async (event) => await CustomMods.action(event)
    );
  }
}

module.exports = IpcHandlers;
