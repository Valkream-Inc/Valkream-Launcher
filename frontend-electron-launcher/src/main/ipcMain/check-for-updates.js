/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { autoUpdater } = require("electron-updater");
const PathManager = require("../../shared/utils/pathsManager.js");
const { hasInternetConnection } = require(PathManager.getSharedUtils());
const { baseUrl } = require(PathManager.getConstants());

class CheckForUpdates {
  constructor(event) {
    this.event = event;
    this.timeout = 1000;
  }

  async init() {
    if (!(await hasInternetConnection()))
      return this.onError(
        "no_internet",
        "❌ Pas de connexion internet. Impossible de vérifier les mises à jour."
      );

    //config
    autoUpdater.allowDowngrade = true; // Autoriser le downgrade
    autoUpdater.setFeedURL({
      provider: "generic",
      url: `${baseUrl}/launcher/latest/`,
    });
    autoUpdater.autoDownload = false;

    //listeners
    autoUpdater.removeAllListeners();
    autoUpdater.on("error", (err) => this.onError(err));
    autoUpdater.on("update-not-available", () =>
      this.onMsg("🟢 Aucune mise à jour.", true)
    );

    autoUpdater.on("update-available", async (info) => {
      this.onMsg("🔄 Mise à jour disponible...");

      try {
        await autoUpdater.downloadUpdate();
        this.onMsg("✅ Mise à jour téléchargée. Redémarrage...");
        setTimeout(() => autoUpdater.quitAndInstall(false, true), this.timeout);
      } catch (err) {
        this.onError(`Erreur téléchargement update: ${err}`);
      }
    });

    // Lancer la vérification
    try {
      await autoUpdater.checkForUpdates();
    } catch (err) {
      this.onError(`Erreur lors de la vérification des mises à jour: ${err}`);
    }
  }

  onError = (err, msg) => {
    console.error("Erreur mise à jour :", err);
    this.event.reply(
      "update_status",
      msg || `❌ Erreur lors de la mise à jour.`
    );
    return setTimeout(
      () => this.event.reply("launch_main_window"),
      this.timeout
    );
  };

  onMsg = (msg, redirect = false) => {
    this.event.reply("update_status", msg);
    return redirect
      ? setTimeout(() => this.event.reply("launch_main_window"), this.timeout)
      : null;
  };
}

module.exports = CheckForUpdates;
