/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const PathsManager = require("../../../shared/pathsManager.js");
window.PathsManager = PathsManager;

// import panel
// const Home = require("./panels/home/home.js");
// const Settings = require("./panels/settings/settings.js");
// const SteamCheck = require("./panels/steam-check/steam-check.js");

// import modules
const { changePanel, Logger } = require(PathsManager.getUtils());

window.logger = Logger;

// libs
const { ipcRenderer } = require("electron");

const Home = require("./panels/home/home.js");
// const Settings = require("./panels/settings/settings.js");
// const SteamCheck = require("./panels/steam-check/steam-check.js");

class Launcher {
  async init() {
    this.initFrame();
    await this.applyMusicSetting();
    // this.createPanels(Home, Settings, SteamCheck);
    await this.createPanels(Home);
    this.startLauncher();
  }

  async applyMusicSetting() {
    try {
      const videoElement = document.getElementById("background-video");
      const musicEnabled = await ipcRenderer.invoke(
        "get-settings",
        "musicEnabled"
      );
      videoElement.muted = musicEnabled;
    } catch (error) {
      console.error(
        "Erreur lors de l'application du paramètre musique:",
        error
      );
    }
  }

  initFrame() {
    document.querySelector(`#minimize`).addEventListener("click", () => {
      ipcRenderer.send("main-window-minimize");
    });

    let maximize = document.querySelector(`#maximize`);
    maximize.addEventListener("click", () => {
      ipcRenderer.send("main-window-maximize");
      maximize.classList.toggle("icon-maximize");
      maximize.classList.toggle("icon-restore-down");
    });

    document.querySelector(`#close`).addEventListener("click", () => {
      ipcRenderer.send("main-window-close");
      ipcRenderer.send("app-quit");
    });
  }

  async createPanels(...panels) {
    const panelsElem = document.querySelector(".panels");

    // Préparer toutes les promesses de chargement
    const htmlPromises = panels.map((panel) =>
      fetch(`panels/${panel.id}/${panel.id}.html`)
        .then((res) => res.text())
        .then((html) => ({ panel, html }))
    );

    // Attendre tous les fetchs en parallèle
    const loadedPanels = await Promise.all(htmlPromises);

    for (const { panel, html } of loadedPanels) {
      window.logger.info(`Initializing ${panel.name} Panel...`);

      const div = document.createElement("div");
      div.classList.add("panel", "content-scroll", panel.id);
      div.innerHTML = html;

      panelsElem.appendChild(div);
      new panel().init(this.config);
    }
  }

  async startLauncher() {
    changePanel("home");
  }
}

new Launcher().init();
