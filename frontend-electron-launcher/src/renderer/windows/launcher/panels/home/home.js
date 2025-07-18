/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { shell, ipcRenderer } = require("electron");

const {
  changePanel,
  Popup,
  EventManager,
  LauncherManager,
} = require(window.PathsManager.getUtils());

const UpdateBigButtonAction = require("./updateBigButtonAction");
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
    new UpdateBigButtonAction().init(
      this.disabledMainButton,
      this.enableMainButton,
      this.changeMainButtonEvent
    );
  };

  // startGame = async () => {
  //   this.disabledMainButton();
  //   LauncherManager.playGame();
  //   this.enableMainButton();
  // };

  // updateGame = async () => {
  //   const playInstallBtn = document.querySelector("#play-install-btn");
  //   playInstallBtn.disabled = true;
  //   try {
  //     await LauncherManager.uninstallGame();
  //     await this.installGame();
  //   } catch (err) {
  //     console.error(err);
  //     showSnackbar("Erreur lors de la mise à jour du jeu !", 3000, "error");
  //   } finally {
  //     await this.checkOnlineVersion();
  //     playInstallBtn.disabled = false;
  //   }
  // };

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
