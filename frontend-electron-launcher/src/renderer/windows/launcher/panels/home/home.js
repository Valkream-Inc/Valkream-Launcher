/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { shell, ipcRenderer } = require("electron");
const { formatBytes } = require("valkream-function-lib");

const {
  changePanel,
  Popup,
  showSnackbar,
  EventManager,
  LauncherManager,
  GameManager,
  SteamManager,
  ThunderstoreManager,
} = require(window.PathsManager.getUtils());
const { hasInternetConnection } = require(window.PathsManager.getSharedUtils());
const { isSteamInstallation } = require(window.PathsManager.getConstants());

class Home {
  static id = "home";
  async init() {
    this.socialLick();
    this.updateCopyright();
    document
      .querySelector(".settings-btn")
      .addEventListener("click", (e) => changePanel("settings"));
    this.tipsEvent();
    this.showActualEvent();
    this.checkOnlineVersion();
    this.showServerInfo();
  }

  updateCopyright = () => {
    const versionEl = document.getElementById("version");
    if (versionEl) versionEl.textContent = LauncherManager.getVersion();
  };

  socialLick = () => {
    let socials = document.querySelectorAll(".social-block");

    socials.forEach((social) => {
      const url = social.dataset.url;
      if (url && url.startsWith("http")) {
        social.addEventListener("click", (e) => {
          shell.openExternal(url);
        });
      }
    });
  };

  tipsEvent = () => {
    document
      .querySelector(".tips-bottom-left")
      .addEventListener("click", () => {
        const tipsPopup = new Popup();
        tipsPopup.openPopup({
          title:
            "<span style='color:#4ec3ff;'>Bienvenue sur le serveur Valkream</span>",
          content: `
            Lorsque vous êtes en jeu, soyez connecté sur le serveur Mumble et dans le canal « Vocal en jeu » du serveur Discord Valkream.<br><br>
            Les informations et actualités sont disponibles sur la page Web et sur le serveur Discord. (si vous avez besoin d'aide, n'hésitez pas à nous rejoindre sur notre serveur Discord)<br><br>
            <span style='display:block;text-align:center;color:#4ec3ff;font-weight:bold;font-size:1.2em;margin-top:1em;'>Bon Jeu!</span>`,
          color: "white",
          background: true,
          options: true,
        });
      });
  };

  showServerInfo = async () => {
    const setServerInfos = (infos) => {
      const serverInfosText = document.querySelector("#server-infos");
      const serverPingText = document.querySelector("#server-ping");
      const serverPlayersText = document.querySelector("#server-players");

      const isOnline = infos.status === "server online";
      serverInfosText.innerHTML = isOnline ? "🟢 En ligne" : "🔴 Hors ligne";
      serverPingText.innerHTML = isOnline ? `(${infos.ping} ms)` : "";
      serverPlayersText.innerHTML = isOnline
        ? `${infos.players.online}/${infos.players.max}`
        : "--/--";
    };

    ipcRenderer.send("get-server-infos");
    ipcRenderer.on("update-server-info", (event, infos) =>
      setServerInfos(infos)
    );
  };

  showActualEvent = async () => {
    const eventPopup = new Popup();
    const event = new EventManager((event) => {
      document.querySelector(".event-title").textContent = event.name;
      document.querySelector(".event-date").textContent = new Date(
        event.date
      ).toLocaleString();
      document.querySelector(".event-image").src = event.image;
      document.querySelector(".event-container").style = event.enabled
        ? ""
        : "display: none";
      document.querySelector(".event-container").onclick = () => {
        // Crée un élément de lien qui déclenchera openExternalPath
        const linkId = "external-event-link";

        eventPopup.openPopup({
          title: `<span style='color:#4ec3ff;'>${event.name}</span>`,
          content: `${event.description}<br\>
            <span id="${linkId}" style="display:block;text-align:center;color:#4ec3ff;font-weight:bold;font-size:1.2em;margin-top:1em;cursor:pointer;">
              Voir sur le site Web
            </span>
          `,
          color: "white",
          background: true,
          options: true,
        });

        // Attendre que le popup soit ouvert puis ajouter le gestionnaire de clic
        setTimeout(() => {
          const linkElement = document.getElementById(linkId);
          if (linkElement)
            linkElement.onclick = () => shell.openExternal(event.link);
        }, 50);
      };
    });
    event.init();
  };

  checkOnlineVersion = async () => {
    this.disabledMainButton();
    const callback = (text, downloadedBytes, totalBytes, percent, speed) => {
      this.changeMainButtonEvent({
        text: `${text}
        (${percent}%)
        (${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)})
        à ${formatBytes(speed)}/s`,
      });
    };
    try {
      const isInternetConnected = await hasInternetConnection();
      const isInstalled = GameManager.getIsInstalled();
      let localVersionConfig = null;
      let onlineVersionConfig = null;
      let upToDate = false;
      let maintenance = false;
      if (isInternetConnected) {
        try {
          onlineVersionConfig =
            await ThunderstoreManager.getOnlineVersionConfig();
          maintenance = onlineVersionConfig.maintenance || false;
        } catch (e) {
          showSnackbar("Impossible de récupérer la version en ligne.", "error");
        }
        try {
          localVersionConfig =
            await ThunderstoreManager.getLocalVersionConfig();
        } catch (e) {
          localVersionConfig = { version: "0.0.0" };
        }
        upToDate =
          localVersionConfig &&
          onlineVersionConfig &&
          localVersionConfig.version === onlineVersionConfig.version;
      }
      // Cas 1 : Pas installé et pas de connexion internet
      if (!isInstalled && !isInternetConnected) {
        this.changeMainButtonEvent({
          text: "❌ Installation Impossible - Pas de connexion internet",
          onclick: this.checkOnlineVersion,
        });
        return;
      }
      // Cas 2 : Pas installé et internet OK
      if (!isInstalled && isInternetConnected) {
        this.changeMainButtonEvent({
          text: "Installer",
          onclick: async () => {
            this.disabledMainButton();
            try {
              if (isSteamInstallation) {
                await SteamManager.install();
                await GameManager.installBepInEx(callback);
              } else {
                await GameManager.dowload(callback);
                await GameManager.unzip(callback);
                await GameManager.installBepInEx(callback);
              }
              // Installation des modpacks
              // await ThunderstoreManager.installModpacks(); // À adapter si besoin
              showSnackbar("La dernière version a été installée avec succès !");
            } catch (err) {
              showSnackbar("Erreur lors de l'installation !", "error");
            } finally {
              this.enableMainButton();
              this.checkOnlineVersion();
            }
          },
        });
        return;
      }
      // Cas 3 : Installé, pas internet
      if (isInstalled && !isInternetConnected) {
        this.changeMainButtonEvent({
          text: "Jouer - ⚠️ Attention: Pas de connexion internet",
          onclick: this.startGame,
        });
        return;
      }
      // Cas 4 : Installé, internet, pas à jour (majeur)
      if (
        isInstalled &&
        isInternetConnected &&
        !upToDate &&
        onlineVersionConfig &&
        localVersionConfig
      ) {
        const [majorLocal] = (localVersionConfig.version || "0.0.0").split(".");
        const [majorOnline] = (onlineVersionConfig.version || "0.0.0").split(
          "."
        );
        if (majorLocal !== majorOnline) {
          this.changeMainButtonEvent({
            text: "Réinstaller (nouvelle version majeure)",
            onclick: async () => {
              this.disabledMainButton();
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
                this.enableMainButton();
                this.checkOnlineVersion();
              }
            },
          });
          return;
        } else {
          // Cas 5 : Installé, internet, pas à jour (mineur)
          this.changeMainButtonEvent({
            text: "Mettre à jour",
            onclick: async () => {
              this.disabledMainButton();
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
                this.enableMainButton();
                this.checkOnlineVersion();
              }
            },
          });
          return;
        }
      }
      // Cas 6 : Installé, internet, à jour
      if (isInstalled && isInternetConnected && upToDate) {
        if (maintenance) {
          this.changeMainButtonEvent({
            text: `Jouer (⚠️ Maintenance en cours)`,
            onclick: this.startGame,
          });
        } else {
          this.changeMainButtonEvent({
            text: `Jouer à la v${onlineVersionConfig.version}`,
            onclick: this.startGame,
          });
        }
        return;
      }
      // Cas par défaut
      this.changeMainButtonEvent({
        text: "Erreur inconnue, contactez le support.",
        onclick: this.checkOnlineVersion,
      });
    } catch (err) {
      showSnackbar("Erreur lors de la vérification de la version !", "error");
      this.changeMainButtonEvent({
        text: "Erreur lors de la vérification",
        onclick: this.checkOnlineVersion,
      });
    } finally {
      this.enableMainButton();
    }
  };

  startGame = async () => {
    this.disabledMainButton();
    LauncherManager.playGame();
    this.enableMainButton();
  };

  updateGame = async () => {
    const playInstallBtn = document.querySelector("#play-install-btn");
    playInstallBtn.disabled = true;
    try {
      await LauncherManager.uninstallGame();
      await this.installGame();
    } catch (err) {
      console.error(err);
      showSnackbar("Erreur lors de la mise à jour du jeu !", 3000, "error");
    } finally {
      await this.checkOnlineVersion();
      playInstallBtn.disabled = false;
    }
  };

  changeMainButtonEvent = ({ text, onclick }) => {
    const playInstallBtn = document.querySelector("#play-install-btn");
    playInstallBtn.innerHTML = text;
    if (onclick) playInstallBtn.onclick = onclick;
  };
  disabledMainButton = () => {
    const playInstallBtn = document.querySelector("#play-install-btn");
    playInstallBtn.disabled = true;
  };
  enableMainButton = () => {
    const playInstallBtn = document.querySelector("#play-install-btn");
    playInstallBtn.disabled = false;
  };
}

module.exports = Home;
