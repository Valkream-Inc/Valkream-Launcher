/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { shell, ipcRenderer } = require("electron");
const { changePanel, Popup } = require(window.PathsManager.getUtils());

const UpdateBigButtonAction = require("./updateBigButtonAction");
class Home {
  static id = "home";
  async init() {
    await ipcRenderer.invoke("init");
    this.checkInfos();

    this.updateCopyright();
    this.socialLick();
    this.tipsEvent();

    document
      .querySelector(".settings-btn")
      .addEventListener("click", () => changePanel("settings"));
  }

  checkInfos = async () => {
    window.info = window.info || {};
    const process = new Date().getTime();
    await ipcRenderer.invoke("check-infos", process);

    ipcRenderer.on(`update-infos-${process}`, async (event, info) => {
      if (info.maintenance !== window.info.maintenance) {
        window.info.maintenance = info.maintenance;
        this.updateServerInfo();
      }

      if (info.event !== window.info.event) {
        window.info.event = info.event;
        this.updateActualEvent();
      }

      if (info.serverInfos !== window.info.serverInfos) {
        window.info.serverInfos = info.serverInfos;
        this.updateServerInfo();
      }

      await this.updateMainButton();
    });
  };

  updateCopyright = async () => {
    const versionEl = document.getElementById("version");
    if (versionEl)
      versionEl.textContent = await ipcRenderer.invoke("get-version");
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
          title: "Bienvenue sur le serveur Valkream",
          content: `
            Lorsque vous êtes en jeu, soyez connecté sur le serveur Mumble et dans le canal « Vocal en jeu » du serveur Discord Valkream.<br><br>
            Les informations et actualités sont disponibles sur la page Web et sur le serveur Discord. (si vous avez besoin d'aide, n'hésitez pas à nous joindre sur notre serveur Discord)<br><br>
            <span style='color: orange;'>
              <b>
                ⚠️ La désinstallation du launcher doit UNIQUEMENT s’effectuer via le bouton prévu à cet effet, tout en bas dans les paramètres.
              </b>
            </span>
            `,
        });
      });
  };

  updateServerInfo = () => {
    const infos = window.info?.serverInfos;

    const serverInfosBox = document.querySelector(".server-infos-container");
    const serverInfosText = document.querySelector("#server-infos");
    const serverPingText = document.querySelector("#server-ping");
    const serverPlayersText = document.querySelector("#server-players");

    const isOnline = infos?.status === "server online";
    serverInfosText.innerHTML = window.info?.maintenance?.enabled
      ? "🔵 En Maintenance"
      : isOnline
      ? "🟢 En ligne"
      : "🔴 Hors ligne";
    serverPingText.innerHTML = isOnline ? `(${infos.ping} ms)` : "";
    serverPlayersText.innerHTML = isOnline
      ? `${infos.players.online}/${infos.players.max}`
      : "--/--";

    // maintenance
    if (window.info?.maintenance?.enabled) {
      if (/<[^>]*>/.test(window.info?.maintenance?.description))
        throw new Error("Invalid HTML Insert.");

      const maintenancePopup = new Popup();

      serverInfosBox.onclick = () =>
        maintenancePopup.openPopup({
          title: "Maintenance",
          content: `${(window.info?.maintenance?.description || "").replace(
            "\n",
            "<br>"
          )}
              <br><br>
              <span style='color:yellow;'>La maintenance prendra fin le ${new Date(
                window.info?.maintenance?.end_date
              ).toLocaleString()} si tout se passe bien.</span>`,
          bottomContent: "Bonne Attente !",
        });
    } else {
      serverInfosBox.onclick = () => {};
    }
  };

  updateActualEvent = () => {
    const event = window.info?.event;

    document.querySelector(".event-container").style = event?.enabled
      ? ""
      : "display: none";
    if (!event) return;

    document.querySelector(".event-title").textContent = event.name;
    document.querySelector(".event-date").textContent = new Date(
      event.date
    ).toLocaleString();
    document.querySelector(".event-image").src = event.image;

    const eventPopup = new Popup();

    document.querySelector(".event-container").onclick = () => {
      if (/<[^>]*>/.test(event.description))
        throw new Error("Invalid HTML Insert.");

      // Crée un élément de lien qui déclenchera openExternalPath
      const linkId = "external-event-link";

      eventPopup.openPopup({
        title: event.name,
        content: (event.description || "").replace("\n", "<br>"),
        bottomContent: event.link ? "Voir sur le site Web" : null,
        bottomId: linkId,
      });
      // Attendre que le popup soit ouvert puis ajouter le gestionnaire de clic
      setTimeout(() => {
        if (!event.link) return;
        const linkElement = document.getElementById(linkId);
        if (linkElement)
          linkElement.onclick = () => shell.openExternal(event.link);
      }, 50);
    };
  };

  updateMainButton = async () => {
    if (this.isMainButtonEnabled())
      return new UpdateBigButtonAction().init(
        this.disabledMainButton,
        this.enableMainButton,
        this.changeMainButtonEvent
      );
  };

  changeMainButtonEvent = ({ text, onclick }) => {
    const playInstallBtn = document.querySelector("#play-install-btn");
    playInstallBtn.innerHTML = text;
    if (onclick) playInstallBtn.onclick = onclick;
  };
  disabledMainButton = () => {
    const playInstallBtn = document.querySelector("#play-install-btn");
    const settingsBtn = document.querySelector("#settings-btn");

    playInstallBtn.disabled = true;
    settingsBtn.disabled = true;
    window.isMainProcessRunning = true;
  };
  enableMainButton = () => {
    const playInstallBtn = document.querySelector("#play-install-btn");
    const settingsBtn = document.querySelector("#settings-btn");

    playInstallBtn.disabled = false;
    settingsBtn.disabled = false;
    window.isMainProcessRunning = false;
  };
  isMainButtonEnabled = () => {
    const playInstallBtn = document.querySelector("#play-install-btn");
    return !playInstallBtn.disabled;
  };
}

module.exports = Home;
