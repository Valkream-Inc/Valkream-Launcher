const { formatBytes } = require("valkream-function-lib");

const {
  showSnackbar,
  GameManager,
  SteamManager,
  ThunderstoreManager,
  VersionManager,
} = require(window.PathsManager.getUtils());
const {
  hasInternetConnection,
  isServerReachable,
} = require(window.PathsManager.getSharedUtils());
const { isSteamInstallation } = require(window.PathsManager.getConstants());

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
    this.disabledMainButton = disabledMainButton;
    this.enableMainButton = enableMainButton;
    this.changeMainButtonEvent = changeMainButtonEvent;

    try {
      await VersionManager.updateOnlineVersionConfig();
      await GameManager.init();
      await ThunderstoreManager.init();

      const isInternetConnected = await hasInternetConnection();
      const isServerConnected = await isServerReachable();
      const localVersionConfig = await VersionManager.getLocalVersionConfig();
      const isInstalled =
        (await GameManager.getIsInstalled()) &&
        (await ThunderstoreManager.getIsInstalled()) &&
        (await VersionManager.getIsInstalled());

      let onlineVersionConfig = null;
      let upToDate = false;
      let isMajorUpdate = false;

      if (isServerConnected) {
        onlineVersionConfig = await VersionManager.getOnlineVersionConfig();

        const [majorLocal] = (localVersionConfig.version || "0.0.0").split(".");
        const [majorOnline] = (onlineVersionConfig.version || "0.0.0").split(
          "."
        );
        isMajorUpdate = majorLocal !== majorOnline;

        upToDate =
          localVersionConfig &&
          onlineVersionConfig &&
          localVersionConfig.version === onlineVersionConfig.version;
      }

      // Cas 1 : Pas installé et pas de connexion internet
      if (!isInstalled && !isServerConnected)
        return changeMainButtonEvent({
          text: `❌ Installation Impossible <br/> (Pas de connexion ${
            isInternetConnected ? "au server" : "internet"
          })`,
          onclick: this.reload,
        });

      // Cas 2 : Pas installé et internet OK
      if (!isInstalled && isServerConnected)
        return changeMainButtonEvent({
          text: "Installer",
          onclick: this.install,
        });

      // Cas 3 : Installé, pas internet
      if (isInstalled && !isServerConnected) {
        changeMainButtonEvent({
          text: `Jouer à la ${onlineVersionConfig.version} <br /> (⚠️ Pas de connexion internet)`,
          onclick: this.start,
        });
        return;
      }

      // Cas 4 : Installé, internet, pas à jour (majeur)
      if (isInstalled && isServerConnected && !upToDate && isMajorUpdate) {
        return changeMainButtonEvent({
          text: "Réinstaller <br/>(nouvelle version majeure)",
          onclick: this.install,
        });
      }

      // Cas 5 : Installé, internet, pas à jour (mineur)
      if (isInstalled && isServerConnected && !upToDate && !isMajorUpdate) {
        return changeMainButtonEvent({
          text: "Mettre à jour",
          onclick: this.upDate,
        });
      }

      // Cas 6 : Installé, internet, à jour
      if (isInstalled && isServerConnected && upToDate)
        return changeMainButtonEvent({
          text: `Jouer à la v${onlineVersionConfig.version} ${
            window.maintenance?.isInMaintenance
              ? " <br> (⚠️ Maintenance en cours)"
              : ""
          }`,
          onclick: this.start,
        });

      // Cas par défaut
      return changeMainButtonEvent({
        text: "Erreur inconnue, contactez le support.",
        onclick: this.reload,
      });
    } catch (err) {
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
    await new UpdateBigButtonAction().init(
      this.disabledMainButton,
      this.enableMainButton,
      this.changeMainButtonEvent
    );
  };

  install = async () => {
    this.disabledMainButton();
    try {
      let isOk = true;
      this.changeMainButtonEvent({ text: "Installation...", onclick: null });
      if (isOk) isOk = await GameManager.uninstall();

      // initialisation des sous-folders supprimés
      await GameManager.init();
      await ThunderstoreManager.init();

      if (isSteamInstallation) {
        // await SteamManager.install();
        // await GameManager.installBepInEx(callback);
      } else {
        if (isOk) isOk = await GameManager.dowload(this.callback);
        if (isOk) isOk = await GameManager.unzip(this.callback);
      }

      if (isOk) isOk = await GameManager.dowloadBepInEx(this.callback);
      if (isOk) isOk = await GameManager.unzipBepInEx(this.callback);

      if (isOk) isOk = await ThunderstoreManager.downloadModpack(this.callback);
      if (isOk) isOk = await ThunderstoreManager.unzipModpack(this.callback);

      if (isOk) isOk = await ThunderstoreManager.dowloadMods(this.callback);
      if (isOk) isOk = await ThunderstoreManager.unzipMods(this.callback);

      this.changeMainButtonEvent({ text: "Verification...", onclick: null });
      // if (isOk) await ThunderstoreManager.ckeckPluginsAndConfig();
      if (isOk) isOk = await VersionManager.updateLocalVersionConfig();

      if (!isOk) throw new Error("Erreur lors de l'installation !");
      else showSnackbar("La dernière version a été installée avec succès !");
    } catch (err) {
      console.error(err);
      showSnackbar("Erreur lors de l'installation !", "error");
    } finally {
      this.enableMainButton();
      await this.reload();
    }
  };

  start = async () => {
    this.disabledMainButton();
    try {
      let isOk = true;
      if (isOk) isOk = await GameManager.play();

      if (!isOk) throw new Error("Erreur lors du lancement du jeu !");
      else showSnackbar("Le jeu a été lancé avec succès !");
    } catch (err) {
      console.error(err);
      showSnackbar("Erreur lors du lancement du jeu !", "error");
    } finally {
      this.enableMainButton();
    }
  };

  upDate = async () => {
    this.disabledMainButton();
    try {
      let isOk = true;
      this.changeMainButtonEvent({ text: "Mise à jour...", onclick: null });
      if (isOk) isOk = await ThunderstoreManager.uninstallModpackConfig();

      if (isOk) isOk = await ThunderstoreManager.downloadModpack(this.callback);
      if (isOk) isOk = await ThunderstoreManager.unzipModpack(this.callback);

      this.changeMainButtonEvent({ text: "Préparation...", onclick: null });
      if (isOk) isOk = await ThunderstoreManager.update(this.callback);

      this.changeMainButtonEvent({ text: "Verification...", onclick: null });
      // if (isOk) await ThunderstoreManager.ckeckPluginsAndConfig();
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
