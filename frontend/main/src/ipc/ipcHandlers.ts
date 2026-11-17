/**
 * @author Valkream Team
 * @license MIT-NC
 */

import fs from "fs";
import path from "path";
import { ipcMain, app, dialog, shell } from "electron";
import type { BrowserWindow, IpcMainInvokeEvent } from "electron";

import type { GameName, SettingKey, Settings } from "@shared/types";

import CheckForUpdates from "./handlers/check-for-updates";
import CheckInfos from "./handlers/check-infos";

import SettingsManager from "../manager/settingsManager";
import LauncherManager from "../manager/launcherManager";

import * as MainWindow from "../windows/mainWindow";
import * as UpdateWindow from "../windows/updateWindow";

import ValheimIpcHandlers from "./ValheimIpcHandlers";
import SevenDtoDIpcHandlers from "./SevenDtoDIpcHandlers";
import InstanceIpcHandlers from "./InstanceIpcHandlers";

// Fenêtre principale (supposée ouverte quand les handlers sont appelés)
const mainWindow = () => MainWindow.getWindow() as BrowserWindow;

class IpcHandlers {
  async openAppData(): Promise<string> {
    const appDataPath = path.join(app.getPath("appData"));
    const valkreamLauncherPath = path.join(appDataPath, "Valkream-Launcher");

    if (fs.existsSync(valkreamLauncherPath))
      return await shell.openPath(valkreamLauncherPath);
    else throw new Error("Le dossier AppData n'existe pas !");
  }

  async openLink(event: IpcMainInvokeEvent, url = ""): Promise<void> {
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

  async choseFolder(): Promise<string | null> {
    const result = await dialog.showOpenDialog(mainWindow(), {
      properties: ["openDirectory"],
      title: "Choisissez le dossier",
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
  }

  /* Main Fucntions */
  init(): void {
    // games ipc
    ValheimIpcHandlers();
    SevenDtoDIpcHandlers();

    // instances (nouveau système)
    InstanceIpcHandlers();

    // update  windows
    ipcMain.on("update-window-close", () => UpdateWindow.destroyWindow());
    ipcMain.on("check-for-updates", (event) =>
      new CheckForUpdates().init(event)
    );

    // main windows
    ipcMain.on("main-window-open", () => MainWindow.createWindow());
    ipcMain.on("main-window-close", () => MainWindow.destroyWindow());
    ipcMain.on("main-window-reload", () => mainWindow().reload());
    ipcMain.on("main-window-minimize", () => mainWindow().minimize());
    ipcMain.on("main-window-hide", () => mainWindow().hide());
    ipcMain.on("main-window-show", () => mainWindow().show());
    ipcMain.handle("main-window-restart", () => {
      app.relaunch();
      app.exit(0);
    });
    ipcMain.on("main-window-maximize", () => {
      if (mainWindow().isMaximized()) {
        mainWindow().unmaximize();
      } else {
        mainWindow().maximize();
      }
    });

    // general
    ipcMain.on("app-quit", () => {
      app.quit();
      app.exit(0);
    });

    // infos
    ipcMain.handle("get-version:launcher", () => LauncherManager.getVersion());
    ipcMain.handle("get-infos", async (event, game: GameName) => await CheckInfos(game));

    // utils
    ipcMain.handle("open-link", this.openLink.bind(this));
    ipcMain.handle(
      "get-settings",
      async (event, setting: SettingKey) =>
        await SettingsManager.getSetting(setting)
    );
    ipcMain.handle(
      "set-settings",
      async (event, setting: SettingKey, value: Settings[SettingKey]) =>
        await SettingsManager.setSetting(setting, value)
    );
    ipcMain.handle(
      "main-window-open-devTools",
      async () =>
        await mainWindow().webContents.openDevTools(/*{ mode: "detach" }*/)
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

export default IpcHandlers;
