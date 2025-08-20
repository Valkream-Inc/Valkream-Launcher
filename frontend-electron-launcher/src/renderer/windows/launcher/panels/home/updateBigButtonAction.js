/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { ipcRenderer } = require("electron");
const { formatBytes } = require("valkream-function-lib");
const { showSnackbar, Popup } = require(window.PathsManager.getUtils());
class UpdateBigButtonAction {
  callback = (text, downloadedBytes, totalBytes, percent, speed) => {
    this.changeMainButtonEvent({
      text: `${text}<br/>
    (${percent}%)
    (${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)})
    à ${formatBytes(speed)}/s`,
    });
  };

  init = async (
    disabledMainButton = () => {},
    enableMainButton = () => {},
    changeMainButtonEvent = ({ text, onclick }) => {}
  ) => {
    // init the update button function
    window.updateMainButton = this.reload;

    this.disabledMainButton = disabledMainButton;
    this.enableMainButton = enableMainButton;
    this.changeMainButtonEvent = changeMainButtonEvent;

    try {
      await ipcRenderer.invoke("reload");

      const getInstallationStatut = await ipcRenderer.invoke(
        "get-installation-statut"
      );

      console.log(getInstallationStatut);

      const {
        isInternetConnected,
        isServerReachable,
        isInstalled,
        isUpToDate,
        isMajorUpdate,
        isAdminModsActive,
        isAdminModsInstalled,
        isAdminModsAvailable,
        isBoostfpsModsActive,
        isBoostfpsModsInstalled,
        isBoostfpsModsAvailable,
      } = getInstallationStatut;

      // Cas 0 : En cours de chargement
      if (
        isServerReachable === undefined ||
        isServerReachable === null ||
        window.info?.maintenance === undefined ||
        window.info?.maintenance === null
      )
        return setTimeout(this.reload, 100);

      // cas 1.1: Admin mods gestion
      if (
        isInstalled &&
        isInternetConnected &&
        isAdminModsActive &&
        !isAdminModsInstalled &&
        isAdminModsAvailable
      ) {
        this.disabledMainButton();
        // await ThunderstoreManager.InstallCustomMods(admin_mods, this.callback);
        this.enableMainButton();

        return await this.reload();
      } else if (isInstalled && !isAdminModsActive && isAdminModsInstalled) {
        this.changeMainButtonEvent({
          text: "Désinstallation des mods admin...",
          onclick: null,
        });
        this.disabledMainButton();
        // await ThunderstoreManager.unInstallCustomMods(admin_mods);
        this.enableMainButton();
        return await this.reload();
      }
      // cas 1.2: BoostFPS mods gestion
      if (
        isInstalled &&
        isInternetConnected &&
        isBoostfpsModsActive &&
        !isBoostfpsModsInstalled &&
        isBoostfpsModsAvailable
      ) {
        this.disabledMainButton();
        // await ThunderstoreManager.InstallCustomMods(
        //   boostfps_mods,
        //   this.callback
        // );
        this.enableMainButton();

        return await this.reload();
      } else if (
        isInstalled &&
        !isBoostfpsModsActive &&
        isBoostfpsModsInstalled
      ) {
        this.changeMainButtonEvent({
          text: "Désinstallation des mods pour booster les FPS...",
          onclick: null,
        });
        this.disabledMainButton();
        // await ThunderstoreManager.unInstallCustomMods(boostfps_mods);
        this.enableMainButton();
        return await this.reload();
      }

      // Cas 2 : Pas installé et pas de connexion internet
      if (!isInstalled && (!isServerReachable || !isInternetConnected))
        return changeMainButtonEvent({
          text: `Installation Impossible <br/> (❌ Pas de connexion ${
            isInternetConnected ? "au server" : "internet"
          }.)`,
          onclick: this.reload,
        });

      // Cas 3 : Pas installé et internet OK
      if (!isInstalled && isServerReachable && isInternetConnected)
        return changeMainButtonEvent({
          text: "Installer",
          onclick: this.install,
        });

      // Cas 4 : Installé, pas internet
      if (isInstalled && (!isServerReachable || !isInternetConnected)) {
        changeMainButtonEvent({
          text: `Jouer à la v${await ipcRenderer.invoke("get-version:game")}
           <br /> (⚠️ Pas de connexion ${
             isInternetConnected ? "au server" : "internet"
           }.)`,
          onclick: this.start,
        });
        return;
      }

      // Cas 5 : Installé, internet, pas à jour (majeur)
      if (
        isInstalled &&
        isServerReachable &&
        isInternetConnected &&
        !isUpToDate &&
        isMajorUpdate
      ) {
        return changeMainButtonEvent({
          text: "Réinstaller <br/>(⚠️ Nouvelle version majeure.)",
          onclick: this.install,
        });
      }

      // Cas 6 : Installé, internet, pas à jour (mineur)
      if (
        isInstalled &&
        isServerReachable &&
        isInternetConnected &&
        !isUpToDate &&
        !isMajorUpdate
      ) {
        return changeMainButtonEvent({
          text: "Mettre à jour",
          onclick: () => this.upDate(onlineVersionConfig, localVersionConfig),
        });
      }

      // Cas 7 : Installé, internet, à jour
      if (
        isInstalled &&
        isServerReachable &&
        isInternetConnected &&
        isUpToDate
      ) {
        const isMaintenanceEnabled = window.maintenance?.enabled;

        return changeMainButtonEvent({
          text: `Jouer à la v${await ipcRenderer.invoke("get-version:game")} 
          ${isMaintenanceEnabled ? " <br> (⚠️ Maintenance en cours.)" : ""}
          ${isAdminModsActive ? " <br> (⚠️ Mods Admin activés.)" : ""}`,
          onclick: this.start,
        });
      }

      // Cas par défaut
      return changeMainButtonEvent({
        text: "Erreur inconnue, contactez le support.",
        onclick: this.reload,
      });
    } catch (err) {
      console.error(err);
      showSnackbar("Erreur lors de la vérification de la version !", "error");
      changeMainButtonEvent({
        text: "Erreur lors de la vérification",
        onclick: this.reload,
      });
    } finally {
      enableMainButton();
    }
  };

  reload = async () => {
    return await this.init(
      this.disabledMainButton,
      this.enableMainButton,
      this.changeMainButtonEvent
    );
  };

  install = async () => {
    if (!window.isUserAlertedAboutInstall) {
      const isCustomGamePathSpecified = await ipcRenderer.invoke(
        "get-settings",
        "customGamePath"
      );

      window.isUserAlertedAboutInstall = true;
      const alertPopup = new Popup();
      return alertPopup.openPopup({
        title: "Installation du launcher",
        content: isCustomGamePathSpecified
          ? `Bienvenue sur Valkream.
            <br>
            Bienvenu sur Valkream.
            Une installation antérieur à été détecté, un chemin d'installation personnalisé est déjà configuré. Vous pouvez le changer dans les paramètres du lancher.
            <br>
            Cela entraînera cependant une réinstallation complète du jeu.
            <br>
            <br>
            <span style='color: orange;'>
              <b>
                ⚠️ La désinstallation du launcher doit UNIQUEMENT s’effectuer via le bouton prévu à cet effet, tout en bas dans les paramètres.
              </b>
            </span>`
          : `Bienvenue sur Valkream.
            <br>
            Vous pouvez spécifier un chemin d'installation personnalisé via les paramètres de launcher.
            <br>
            <br>
            <span style='color: orange;'>
              <b>
                ⚠️ La désinstallation du launcher doit UNIQUEMENT s’effectuer via le bouton prévu à cet effet, tout en bas dans les paramètres.
              </b>
            </span>`,
        onExit: async () => {
          await this.install();
        },
      });
    }

    this.disabledMainButton();
    const process = Date.now();
    const progressChannel = `progress-${process}`;
    const errorChannel = `error-${process}`;
    const doneChannel = `done-${process}`;

    try {
      await new Promise((resolve, reject) => {
        ipcRenderer.once(doneChannel, resolve);
        ipcRenderer.once(errorChannel, (e, errMsg) =>
          reject(new Error(errMsg))
        );

        ipcRenderer.on(progressChannel, (event, data) => {
          this.callback(
            data.text,
            data.processedBytes,
            data.totalBytes,
            data.percent,
            data.speed
          );
        });

        ipcRenderer.send("install", process);
      });

      showSnackbar("✅ Installation terminée", "success");
    } catch (err) {
      console.error(err);
      showSnackbar("❌ Erreur lors de l'installation", "error");
    } finally {
      this.enableMainButton();
      await this.reload();
    }
  };

  start = async () => {
    const videoBackground = document.querySelector("#background-video");

    this.disabledMainButton();
    try {
      const behavior = await ipcRenderer.invoke("start");
      if (behavior === "hide" && videoBackground) {
        videoBackground.pause();

        // Quand le main t’informe que le jeu est terminé, on reprend
        ipcRenderer.once("game-exit", () => {
          videoBackground.play();
        });
      }

      showSnackbar("Le jeu a été lancé avec succès !");
    } catch (err) {
      console.error(err);
      showSnackbar("Erreur lors du lancement du jeu !", "error");
    } finally {
      this.enableMainButton();
    }
  };

  upDate = async (onlineVersionConfig, localVersionConfig) => {
    this.disabledMainButton();
    try {
      let isOk = true;
      if (!onlineVersionConfig) isOk = false;

      this.changeMainButtonEvent({ text: "Mise à jour...", onclick: null });
      if (isOk && onlineVersionConfig?.modpack?.gameFolderToPreserve)
        isOk = await GameManager.preserveGameFolder(
          onlineVersionConfig?.modpack?.gameFolderToPreserve
        );
      if (isOk) isOk = await ThunderstoreManager.uninstallModpackConfig();

      if (
        !localVersionConfig?.modpack?.version ||
        !onlineVersionConfig?.modpack?.version ||
        localVersionConfig?.modpack?.version !==
          onlineVersionConfig?.modpack?.version
      ) {
        if (isOk)
          isOk = await ThunderstoreManager.downloadModpack(this.callback);
        if (isOk) isOk = await ThunderstoreManager.unzipModpack(this.callback);
      }

      this.changeMainButtonEvent({ text: "Préparation...", onclick: null });
      if (isOk) isOk = await ThunderstoreManager.update(this.callback);

      this.changeMainButtonEvent({ text: "Verification...", onclick: null });
      if (isOk && onlineVersionConfig?.modpack?.gameFolderToRemove)
        isOk = await GameManager.clean(
          onlineVersionConfig?.modpack?.gameFolderToRemove
        );
      // if (isOk) await ThunderstoreManager.ckeckPluginsAndConfig();
      if (isOk) await GameManager.restoreGameFolder();
      if (isOk) isOk = await VersionManager.updateLocalVersionConfig();

      if (!isOk) throw new Error("Erreur lors de la mise à jour !");
      else showSnackbar("La dernière version a été installée avec succès !");
    } catch (err) {
      console.error(err);
      showSnackbar("Erreur lors de la mise à jour !", "error");
    } finally {
      this.enableMainButton();
      await this.reload();
    }
  };
}

module.exports = UpdateBigButtonAction;
