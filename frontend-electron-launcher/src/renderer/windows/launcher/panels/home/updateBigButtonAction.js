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
      const isInternetConnected = await hasInternetConnection();
      const isServerConnected = await isServerReachable();
      const isInstalled = await GameManager.getIsInstalled();

      let localVersionConfig = null;
      let onlineVersionConfig = null;
      let upToDate = false;
      let maintenance = false;

      if (isServerConnected) {
        ThunderstoreManager.init();

        onlineVersionConfig = await VersionManager.getOnlineVersionConfig();
        localVersionConfig = await VersionManager.getLocalVersionConfig();
        maintenance = window.maintenance?.isInMaintenance;

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
          onclick: this.installGame,
        });

      // Cas 3 : Installé, pas internet
      if (isInstalled && !isServerConnected) {
        changeMainButtonEvent({
          text: "Jouer (⚠️ Pas de connexion internet)",
          onclick: this.startGame,
        });
        return;
      }
      // Cas 4 : Installé, internet, pas à jour (majeur)
      if (
        isInstalled &&
        isServerConnected &&
        !upToDate &&
        onlineVersionConfig &&
        localVersionConfig
      ) {
        const [majorLocal] = (localVersionConfig.version || "0.0.0").split(".");
        const [majorOnline] = (onlineVersionConfig.version || "0.0.0").split(
          "."
        );
        if (majorLocal !== majorOnline) {
          changeMainButtonEvent({
            text: "Réinstaller (nouvelle version majeure)",
            onclick: async () => {
              disabledMainButton();
              try {
                await GameManager.uninstall();
                if (isSteamInstallation) {
                  await SteamManager.install();
                  await GameManager.installBepInEx(callback);
                } else {
                  await GameManager.dowload(callback);
                  await GameManager.unzip(callback);
                  await GameManager.installBepInEx(callback);
                }
                await ThunderstoreManager.installModpacks();
                showSnackbar("Réinstallation terminée !");
              } catch (err) {
                showSnackbar("Erreur lors de la réinstallation !", "error");
              } finally {
                enableMainButton();
                checkOnlineVersion();
              }
            },
          });
          return;
        } else {
          // Cas 5 : Installé, internet, pas à jour (mineur)
          changeMainButtonEvent({
            text: "Mettre à jour",
            onclick: async () => {
              disabledMainButton();
              try {
                await GameManager.uninstall();
                if (isSteamInstallation) {
                  await SteamManager.install();
                  await GameManager.installBepInEx(callback);
                } else {
                  await GameManager.dowload(callback);
                  await GameManager.unzip(callback);
                  await GameManager.installBepInEx(callback);
                }
                // await ThunderstoreManager.installModpacks();
                showSnackbar("Mise à jour terminée !");
              } catch (err) {
                showSnackbar("Erreur lors de la mise à jour !", "error");
              } finally {
                enableMainButton();
                checkOnlineVersion();
              }
            },
          });
          return;
        }
      }
      // Cas 6 : Installé, internet, à jour
      if (isInstalled && isInternetConnected && upToDate) {
        if (maintenance) {
          changeMainButtonEvent({
            text: `Jouer à la v${onlineVersionConfig.version} <br/> (⚠️ Maintenance en cours)`,
            onclick: this.startGame,
          });
        } else {
          changeMainButtonEvent({
            text: `Jouer à la v${onlineVersionConfig.version}`,
            onclick: this.startGame,
          });
        }
        return;
      }
      // Cas par défaut
      changeMainButtonEvent({
        text: "Erreur inconnue, contactez le support.",
        onclick: checkOnlineVersion,
      });
    } catch (err) {
      showSnackbar("Erreur lors de la vérification de la version !", "error");
      changeMainButtonEvent({
        text: "Erreur lors de la vérification",
        onclick: checkOnlineVersion,
      });
    } finally {
      enableMainButton();
    }
  };

  reload = async () =>
    await new UpdateBigButtonAction().init(
      this.disabledMainButton,
      this.enableMainButton,
      this.changeMainButtonEvent
    );

  installGame = async () => {
    this.disabledMainButton();
    try {
      let isOk = false;
      this.changeMainButtonEvent({ text: "Installation...", onclick: null });

      if (isSteamInstallation) {
        // await SteamManager.install();
        // await GameManager.installBepInEx(callback);
      } else {
        isOk = await GameManager.dowload(this.callback);
        if (isOk) isOk = await GameManager.unzip(this.callback);

        if (isOk) isOk = await GameManager.dowloadBepInEx(this.callback);
        if (isOk) isOk = await GameManager.unzipBepInEx(this.callback);
      }

      if (isOk) isOk = await ThunderstoreManager.downloadModpack(this.callback);
      if (isOk) isOk = await ThunderstoreManager.unzipModpack(this.callback);

      if (isOk) isOk = await ThunderstoreManager.dowloadMods(this.callback);
      if (isOk) isOk = await ThunderstoreManager.unzipMods(this.callback);

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

  startGame = async () => {
    this.disabledMainButton();
    await GameManager.play();
    this.enableMainButton();
  };
}

module.exports = UpdateBigButtonAction;
