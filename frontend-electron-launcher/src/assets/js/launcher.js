/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

// import panel
import Home from "./panels/home.js";
import Settings from "./panels/settings.js";

// import modules
import { changePanel, applyMusicSetting, database } from "./utils.js";

// libs
const { ipcRenderer } = require("electron");
const fs = require("fs");

class Launcher {
  async init() {
    this.initFrame();
    this.db = new database();
    await this.initConfigClient();
    await applyMusicSetting();
    this.createPanels(Home, Settings);
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
    });
  }

  async initConfigClient() {
    console.log("Initializing Config Client...");
    let configData = await this.db.readData("configClient");
    if (!configData) {
      await this.db.createData("configClient", {
        launcher_config: { musicEnabled: true },
      });
    }
  }

  async createPanels(...panels) {
    let panelsElem = document.querySelector(".panels");
    for (let panel of panels) {
      console.log(`Initializing ${panel.name} Panel...`);
      let div = document.createElement("div");
      div.classList.add("panel", panel.id);
      div.innerHTML = fs.readFileSync(
        `${__dirname}/panels/${panel.id}.html`,
        "utf8"
      );
      panelsElem.appendChild(div);
      new panel().init(this.config);
    }
  }

  async startLauncher() {
    changePanel("home");
  }
}

new Launcher().init();
