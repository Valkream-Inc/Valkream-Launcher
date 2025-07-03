/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import {
  changePanel,
  popup as Popup,
  pkg,
  showSnackbar,
  hasInternetConnection,
} from "../utils.js";

import EventManager from "../../../manager/eventManager.js";

const { shell } = require("electron");
const launcherManager = require("./manager/launcherManager");
const { formatBytes } = require("@valkream/shared");

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
  }

  updateCopyright = () => {
    const versionEl = document.getElementById("version");
    if (versionEl && pkg && pkg.version) {
      versionEl.textContent = pkg.version;
    }
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

  showActualEvent = async () => {
    const eventPopup = new Popup();
    const event = new EventManager((event) => {
      document.querySelector(".event-title").textContent = event.name;
      document.querySelector(".event-date").textContent = new Date(
        event.date
      ).toLocaleString();
      document.querySelector(".event-image").src = event.image;
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
    const isInternetConnected = await hasInternetConnection();
    let localVersion = await launcherManager.getLocalVersion();

    if (!isInternetConnected) {
      if (localVersion === "0.0.0")
        // pas de connexion internet et pas de version local
        this.changeMainButtonEvent({
          text: "❌ Installation Impossible - Pas de connection internet",
          onclick: this.checkOnlineVersion,
        });
      // pas de connexion internet et version local
      else
        this.changeMainButtonEvent({
          text: "Jouer - ⚠️ Attention: Pas de connexion internet",
          onclick: this.startGame,
        });
    } else {
      let onlineVersion = await launcherManager.getOnlineVersion();

      if (localVersion === "0.0.0")
        // connexion internet mais pas de version local
        this.changeMainButtonEvent({
          text: "Installer",
          onclick: this.installGame,
        });
      else if (localVersion !== onlineVersion)
        // connexion internet et version local pas à jour
        this.changeMainButtonEvent({
          text: "Mettre à jour",
          onclick: this.updateGame,
        });
      // connexion internet et version local à jour
      else
        this.changeMainButtonEvent({
          text: "Jouer à la v" + onlineVersion,
          onclick: this.startGame,
        });
    }
  };

  installGame = async () => {
    const callback = (text, downloadedBytes, totalBytes, percent, speed) => {
      this.changeMainButtonEvent({
        text: `${text} 
        (${percent}%) 
        (${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)}) 
        à ${formatBytes(speed)}/s`,
      });
    };

    this.disabledMainButton();
    try {
      await launcherManager.downloadGame(
        (downloadedBytes, totalBytes, percent, speed) =>
          callback(
            "Téléchargement...",
            downloadedBytes,
            totalBytes,
            percent,
            speed
          )
      );

      await launcherManager.extractGame(
        (downloadedBytes, totalBytes, percent, speed) =>
          callback(
            "Décompression...",
            downloadedBytes,
            totalBytes,
            percent,
            speed
          )
      );

      await launcherManager.setLocalVersion(
        await launcherManager.getOnlineVersion()
      );

      showSnackbar("La derniére version a été installée avec succès !");
    } catch (err) {
      showSnackbar(
        "Erreur lors de l'installation de la derniére version !",
        "error"
      );
    } finally {
      this.enableMainButton();
      this.checkOnlineVersion();
    }
  };

  startGame = async () => {
    this.disabledMainButton();
    launcherManager.playGame();
    this.enableMainButton();
  };

  updateGame = async () => {
    const playInstallBtn = document.querySelector("#play-install-btn");
    playInstallBtn.disabled = true;
    try {
      await launcherManager.uninstallGame();
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

export default Home;
