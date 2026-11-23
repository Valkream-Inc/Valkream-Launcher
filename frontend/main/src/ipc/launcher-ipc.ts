/**
 * @author Valkream Team
 * @license MIT-NC
 */

import fs from "fs";
import path from "path";
import { ipcMain, app, dialog, shell } from "electron";
import type { BrowserWindow, IpcMainInvokeEvent } from "electron";

import type { SettingKey, Settings } from "@shared/types";

import CheckForUpdates from "./check-for-updates.js";

import SettingsManager from "../core/settings.js";
import LauncherManager from "../core/launcher.js";
import DirsManager from "../core/dirs.js";
import { isDev } from "../core/constants.js";
import { syncUninstallPaths, UNINSTALL_PATHS_FILE } from "../lib/fs/uninstall-paths.js";
import { getMoveProgress, moveGamesRoot, type MoveProgress, writeGamesRoot } from "../lib/fs/games-root.js";
import { anySyncRunning } from "./sync-registry.js";
import { isSafeExternalUrl } from "../lib/net/safe-link.js";

import * as MainWindow from "../windows/mainWindow.js";
import * as UpdateWindow from "../windows/updateWindow.js";

import registerAdminToolsIpc from "./admin-tools-ipc.js";
import InstanceIpcHandlers from "./instance-ipc.js";
import { LocalizedError } from "../lib/errors/localized-error.js";

// Fenêtre principale (supposée ouverte quand les handlers sont appelés)
const mainWindow = () => MainWindow.getWindow() as BrowserWindow;

class IpcHandlers {
  async openAppData(): Promise<string> {
    const appDataPath = path.join(app.getPath("appData"));
    const valkreamLauncherPath = path.join(appDataPath, "Valkream-Launcher");

    if (fs.existsSync(valkreamLauncherPath))
      return await shell.openPath(valkreamLauncherPath);
    else throw new LocalizedError("err.appdataMissing");
  }

  async openLink(event: IpcMainInvokeEvent, url = ""): Promise<void> {
    if (!isSafeExternalUrl(url)) throw new LocalizedError("err.invalidUrl");
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
    // jeux : un seul canal IPC pour toutes les instances
    InstanceIpcHandlers();
    registerAdminToolsIpc();

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

    // Dossier d'installation des jeux (réglage général) : déplacement atomique
    ipcMain.handle("games-root:get", () => ({
      path: DirsManager.gamesRoot(),
      isDefault: DirsManager.gamesRoot() === DirsManager.rootPath(),
    }));
    // Progression du déplacement : au plus un événement toutes les 100 ms (le premier et le dernier passent toujours)
    // Liste des dossiers de jeux à supprimer à la désinstallation complète (relue par le désinstalleur)
    const syncUninstall = () => {
      if (isDev) return;
      syncUninstallPaths({
        file: path.join(DirsManager.rootPath(), UNINSTALL_PATHS_FILE),
        gamesRoot: DirsManager.gamesRoot(),
        defaultRoot: DirsManager.rootPath(),
      });
    };
    let lastSent = 0;
    const sendProgress = (progress: MoveProgress) => {
      const now = Date.now();
      if (progress.active && progress.done > 0 && progress.done < progress.total && now - lastSent < 100) return;
      lastSent = now;
      const window = MainWindow.getWindow();
      if (window && !window.isDestroyed()) window.webContents.send("games-root:progress", progress);
    };
    ipcMain.handle("games-root:move-state", () => getMoveProgress());
    ipcMain.handle("games-root:change", async () => {
      const folder = await this.choseFolder();
      if (!folder) return null;
      await moveGamesRoot({
        fromRoot: DirsManager.gamesRoot(),
        toRoot: folder,
        configFile: DirsManager.pathsFile(),
        isBusy: anySyncRunning,
        onProgress: sendProgress,
      });
      syncUninstall();
      return folder;
    });
    ipcMain.handle("games-root:reset", async () => {
      await moveGamesRoot({
        fromRoot: DirsManager.gamesRoot(),
        toRoot: DirsManager.rootPath(),
        configFile: DirsManager.pathsFile(),
        isBusy: anySyncRunning,
        record: undefined,
        onProgress: sendProgress,
      });
      writeGamesRoot(DirsManager.pathsFile(), undefined);
      syncUninstall();
      return DirsManager.rootPath();
    });

    // Sélection dossier
    ipcMain.handle("choose-folder", this.choseFolder.bind(this));
  }
}

export default IpcHandlers;
