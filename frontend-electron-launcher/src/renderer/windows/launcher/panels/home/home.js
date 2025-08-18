/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { shell, ipcRenderer } = require("electron");

const { changePanel, Popup } = require(window.PathsManager.getUtils());

// const UpdateBigButtonAction = require("./updateBigButtonAction");
class Home {
  static id = "home";
  async init() {
    await GameManager.restoreGameFolder();

    this.socialLick();
    this.updateCopyright();
    document
      .querySelector(".settings-btn")
      .addEventListener("click", (e) => changePanel("settings"));
    this.tipsEvent();
    this.showActualEvent();
    this.updateMainButton();
    this.showServerInfo();
    this.updateMaintenanceStatus();

    setInterval(this.updateMainButton, 5000);
  }

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
          title:
            "<span style='color:#4ec3ff;'>Bienvenue sur le serveur Valkream</span>",
          content: `
            Lorsque vous êtes en jeu, soyez connecté sur le serveur Mumble et dans le canal « Vocal en jeu » du serveur Discord Valkream.<br><br>
            Les informations et actualités sont disponibles sur la page Web et sur le serveur Discord. (si vous avez besoin d'aide, n'hésitez pas à nous joindre sur notre serveur Discord)<br><br>
            <span style='color: orange;'>
              <b>
                ⚠️ La désinstallation du launcher doit UNIQUEMENT s’effectuer via le bouton prévu à cet effet, tout en bas dans les paramètres.
              </b>
            </span>
            `,
          color: "white",
          background: true,
          options: true,
        });
      });
  };

  showServerInfo = async () => {
    const setServerInfos = (infos) => {
      const serverInfosBox = document.querySelector(".server-infos-container");
      const serverInfosText = document.querySelector("#server-infos");
      const serverPingText = document.querySelector("#server-ping");
      const serverPlayersText = document.querySelector("#server-players");

      const isOnline = infos.status === "server online";
      serverInfosText.innerHTML = window.maintenance?.enabled
        ? "🔵 En Maintenance"
        : isOnline
        ? "🟢 En ligne"
        : "🔴 Hors ligne";
      serverPingText.innerHTML = isOnline ? `(${infos.ping} ms)` : "";
      serverPlayersText.innerHTML = isOnline
        ? `${infos.players.online}/${infos.players.max}`
        : "--/--";

      if (window.maintenance?.enabled) {
        if (
          typeof window.maintenance?.description !== "string" ||
          /<[^>]*>/.test(window.maintenance?.description)
        )
          throw new Error("La description ne doit pas contenir de HTML.");

        const maintenancePopup = new Popup();
        serverInfosBox.onclick = () =>
          maintenancePopup.openPopup({
            title: "Maintenance",
            content: `${(window.maintenance?.description || "").replace(
              "\n",
              "<br>"
            )}
              <br><br>
              <span style='color:yellow;'>La maintenance prendra fin le ${new Date(
                window.maintenance?.end_date
              ).toLocaleString()} si tout se passe bien.</span>`,
            bottomContent: "Bonne Attente !",
            background: true,
            color: "white",
            options: true,
          });
      } else {
        serverInfosBox.onclick = () => {};
      }
    };

    ipcRenderer.send("get-server-infos");
    ipcRenderer.on("update-server-info", (event, infos) => {
      setServerInfos(infos);
    });
  };

  updateMaintenanceStatus = async () =>
    await new MaintenanceManager((maintenance) => {
      window.maintenance = maintenance;
    }).init();

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

        if (
          typeof event.description !== "string" ||
          /<[^>]*>/.test(event.description)
        )
          throw new Error("La description ne doit pas contenir de HTML.");

        eventPopup.openPopup({
          title: `<span style='color:#4ec3ff;'>${event.name}</span>`,
          content: (event.description || "").replace("\n", "<br>"),
          bottomContent: event.link ? "Voir sur le site Web" : null,
          bottomId: linkId,
          color: "white",
          background: true,
          options: true,
        });

        // Attendre que le popup soit ouvert puis ajouter le gestionnaire de clic
        setTimeout(() => {
          if (!event.link) return;

          const linkElement = document.getElementById(linkId);
          if (linkElement)
            linkElement.onclick = () => shell.openExternal(event.link);
        }, 50);
      };
    });
    event.init();
  };

  updateMainButton = async () => {
    // if (this.isMainButtonEnabled())
    // return new UpdateBigButtonAction().init(
    //   this.disabledMainButton,
    //   this.enableMainButton,
    //   this.changeMainButtonEvent
    // );
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
