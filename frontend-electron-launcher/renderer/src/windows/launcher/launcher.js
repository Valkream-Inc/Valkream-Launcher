/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const PathsManager = require("../../../shared/pathsManager.js");
window.PathsManager = PathsManager;

// import panel
const Home = require("./panels/home/home.js");
const Settings = require("./panels/settings/settings.js");
// const SteamCheck = require("./panels/steam-check/steam-check.js");

// import modules
const { changePanel, Logger } = require(PathsManager.getUtils());

// libs
const { ipcRenderer } = require("electron");

class Launcher {
  async init() {
    this.initFrame();
    // this.createPanels(Home, Settings, SteamCheck);
    await this.createPanels(Home, Settings);
    this.startLauncher();
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
      Logger.info(`Initializing ${panel.name} Panel...`);

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
