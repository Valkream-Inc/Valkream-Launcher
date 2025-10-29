/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */
const fs = require("fs");
const { app } = require("electron");

const { autoUpdater } = require("electron-updater");
const { formatBytes } = require("../../utils/function/formatBytes");

const { baseUrl } = require("../../constants");
const SettingsManager = require("../../manager/settingsManager");
const InfosManager = require("../../manager/infosManager");
const FilesManager = require("../../manager/filesManager");

class CheckForUpdates {
  constructor() {
    this.timeout = 1000;
  }

  async init(event) {
    this.event = event;

    const isBeta = await SettingsManager.getSetting("betaEnabled");

    if (isBeta)
      return this.onMsg(
        "⚠️ Les tests beta sont activés. La mise à jour est désactivée.",
        true
      );

    if (!(await InfosManager.getIsServerReachableFromInternal()))
      return this.onError(
        "no_internet",
        "❌ Pas de connexion au serveur. Impossible de vérifier les mises à jour."
      );

    this.configureUpdater();
    this.attachListeners();

    try {
      await autoUpdater.checkForUpdates();
    } catch (err) {
      this.onError(err, "❌ Échec de la vérification des mises à jour.");
    }
  }

  configureUpdater() {
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

  attachListeners() {
    autoUpdater.on("checking-for-update", () => {
      this.onMsg("🔍 Vérification des mises à jour...");
    });

    autoUpdater.on("update-not-available", () => {
      this.onMsg("🟢 Aucune mise à jour.", true);
    });

    autoUpdater.on("update-available", async (info) => {
      this.onMsg(
        `🔄 Mise à jour disponible...\n(${app.getVersion()} --> ${
          info.version
        })`
      );
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await autoUpdater.downloadUpdate();
      } catch (err) {
        this.onError(err, "❌ Échec du téléchargement de la mise à jour.");
      }
    });

    autoUpdater.on("download-progress", (progress) => {
      const percent = progress.percent?.toFixed(1) ?? "0.0";
      const speed = `${formatBytes(progress.bytesPerSecond)}/s`;
      const transferred = formatBytes(progress.transferred);
      const total = formatBytes(progress.total);

      this.onMsg(`📥 ${percent}% (${transferred} / ${total})\n à ${speed}`);
    });

    autoUpdater.on("update-downloaded", () => {
      this.onMsg("✅ Mise à jour téléchargée. Redémarrage...");
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
      this.onError(err, "❌ Une erreur est survenue lors de la mise à jour.");
    });
  }

  deleteUpdaterDetails() {
    try {
      if (!fs.existsSync(FilesManager.updaterDetailsPath())) return;
      fs.unlinkSync(FilesManager.updaterDetailsPath());
    } catch (err) {
      console.warn("Impossible de supprimer updaterDetails:", err);
    }
  }

  onError = (err, msg) => {
    console.error("Erreur mise à jour :", err);
    this.event.reply("update_status", msg);
    this.deleteUpdaterDetails();
    this.delayRedirect();
  };

  onMsg = (msg, redirect = false) => {
    this.event.reply("update_status", msg);
    this.deleteUpdaterDetails();
    if (redirect) this.delayRedirect();
  };

  delayRedirect() {
    setTimeout(() => {
      this.event.reply("launch_main_window");
    }, this.timeout);
  }
}

module.exports = CheckForUpdates;
