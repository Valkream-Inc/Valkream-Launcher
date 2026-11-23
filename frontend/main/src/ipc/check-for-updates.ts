/**
 * @author Valkream Team
 * @license MIT-NC
 */

import fs from "fs";

import type { IpcMainEvent } from "electron";
import { formatBytes } from "../lib/format/format-bytes.js";
import SettingsManager from "../core/settings.js";
import { translator, type Translate } from "../lib/errors/messages.js";

import { baseUrl } from "../core/constants.js";
import InfosManager from "../core/server-infos.js";
import FilesManager from "../core/files.js";
import LauncherManager from "../core/launcher.js";

import electronUpdater from "electron-updater";
const { autoUpdater } = electronUpdater;

class CheckForUpdates {
  timeout: number;
  t: Translate = translator("fr");
  event!: IpcMainEvent;

  constructor() {
    this.timeout = 1000;
  }

  async init(event: IpcMainEvent): Promise<void> {
    this.event = event;
    // Langue du joueur (réglage) ; la fenêtre de mise à jour n'a pas accès aux réglages
    this.t = translator((await SettingsManager.getSetting("language")) === "en" ? "en" : "fr");

    if (!(await InfosManager.getIsServerReachable()))
      return this.onError(
        "no_internet",
        this.t("update.noServer")
      );

    this.configureUpdater();
    this.attachListeners();

    try {
      await autoUpdater.checkForUpdates();
    } catch (err) {
      this.onError(err, this.t("update.checkFailed"));
    }
  }

  configureUpdater(): void {
    autoUpdater.allowDowngrade = true;
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false; // ⚠️ mieux pour les updates manuelles
    autoUpdater.autoRunAppAfterInstall = true; // relance automatique après install
    autoUpdater.fullChangelog = false;
    autoUpdater.setFeedURL({
      provider: "generic",
      url: `${baseUrl}/launcher/latest/`,
    });

    autoUpdater.removeAllListeners();
  }

  attachListeners(): void {
    autoUpdater.on("checking-for-update", () => {
      this.onMsg(this.t("update.checking"));
    });

    autoUpdater.on("update-not-available", () => {
      this.onMsg(this.t("update.none"), true);
    });

    autoUpdater.on("update-available", async (info) => {
      this.onMsg(
        this.t("update.available", { from: LauncherManager.getVersion(), to: info.version })
      );
      try {
        await new Promise<void>((resolve) => setTimeout(resolve, 1000));
        await autoUpdater.downloadUpdate();
      } catch (err) {
        this.onError(err, this.t("update.downloadFailed"));
      }
    });

    autoUpdater.on("download-progress", (progress) => {
      const percent = progress.percent?.toFixed(1) ?? "0.0";
      const speed = `${formatBytes(progress.bytesPerSecond)}/s`;
      const transferred = formatBytes(progress.transferred);
      const total = formatBytes(progress.total);

      this.onMsg(this.t("update.progress", { percent, done: transferred, total, speed }));
    });

    autoUpdater.on("update-downloaded", () => {
      this.onMsg(this.t("update.downloaded"));
      setTimeout(() => {
        try {
          fs.writeFileSync(FilesManager.updaterDetailsPath(), "update");
        } catch (err) {
          console.warn("Impossible d'écrire updaterDetails:", err);
        }
        autoUpdater.quitAndInstall(false, true);
      }, this.timeout);
    });

    autoUpdater.on("error", (err) => {
      this.onError(err, this.t("update.error"));
    });
  }

  deleteUpdaterDetails(): void {
    try {
      if (!fs.existsSync(FilesManager.updaterDetailsPath())) return;
      fs.unlinkSync(FilesManager.updaterDetailsPath());
    } catch (err) {
      console.warn("Impossible de supprimer updaterDetails:", err);
    }
  }

  onError = (err: unknown, msg: string): void => {
    console.error("Erreur mise à jour :", err);
    this.event.reply("update_status", msg);
    this.deleteUpdaterDetails();
    this.delayRedirect();
  };

  onMsg = (msg: string, redirect = false): void => {
    this.event.reply("update_status", msg);
    this.deleteUpdaterDetails();
    if (redirect) this.delayRedirect();
  };

  delayRedirect(): void {
    setTimeout(() => {
      this.event.reply("launch_main_window");
    }, this.timeout);
  }
}

export default CheckForUpdates;
