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
const fs = require("fs");

class Launcher {
  async init() {
    this.initFrame();
    await this.applyMusicSetting();
    this.createPanels();
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
    let panelsElem = document.querySelector(".panels");
    for (let panel of panels) {
      window.logger.info(`Initializing ${panel.name} Panel...`);
      let div = document.createElement("div");
      div.classList.add("panel", "content-scroll", panel.id);
      div.innerHTML = fs.readFileSync(
        `${__dirname}/panels/${panel.id}/${panel.id}.html`,
        "utf8"
      );
      panelsElem.appendChild(div);
      new panel().init(this.config);
    }
  }

  async startLauncher() {
    changePanel("steam-check");
  }
}

new Launcher().init();
