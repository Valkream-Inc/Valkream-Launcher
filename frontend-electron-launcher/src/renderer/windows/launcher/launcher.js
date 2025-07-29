/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { PathsManager } = require("../../../shared/utils/shared-utils.js");
window.PathsManager = PathsManager;

// import panel
const Home = require("./panels/home/home.js");
const Settings = require("./panels/settings/settings.js");
const SteamCheck = require("./panels/steam-check/steam-check.js");

// import modules
const { changePanel } = require(PathsManager.getUtils());
const { database, isServerReachable } = require(PathsManager.getSharedUtils());

// libs
const { ipcRenderer } = require("electron");
const fs = require("fs");

class Launcher {
  async init() {
    this.initFrame();
    this.db = new database();
    await this.initConfigClient();
    await this.applyMusicSetting();
    await this.initIsServerReachable();
    this.createPanels(Home, Settings, SteamCheck);
    this.startLauncher();
  }

  async applyMusicSetting() {
    try {
      const videoElement = document.getElementById("background-video");
      const db = new database();
      const configClient = await db.readData("configClient");
      const musicEnabled = configClient?.launcher_config?.musicEnabled;

      if (videoElement) {
        videoElement.muted = musicEnabled;
      }
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

  async initConfigClient() {
    console.log("Initializing Config Client...");
    let configData = await this.db.readData("configClient");
    if (!configData) {
      await this.db.createData("configClient", {
        launcher_config: { musicEnabled: true, launchSteam: true },
      });
    }
  }

  async createPanels(...panels) {
    let panelsElem = document.querySelector(".panels");
    for (let panel of panels) {
      console.log(`Initializing ${panel.name} Panel...`);
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

  async initIsServerReachable() {
    const getIsServerReachable = async () => {
      const IsServerReachable = await isServerReachable();
      window.isServerReachable = IsServerReachable;
    };

    getIsServerReachable();
    setInterval(getIsServerReachable, 1000);
  }
}

new Launcher().init();
