/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

// import panel

// import modules
import Config from "./panels/config.js";
import Home from "./panels/home.js";

import { changePanel } from "./utils/utils.js";

// libs
const { ipcRenderer } = require("electron");
const fs = require("fs");

class UpdaterUI {
  async init() {
    this.initFrame();
    this.createPanels(Config, Home);
    this.startUpdaterUI();
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

  async createPanels(...panels) {
    let panelsElem = document.querySelector(".panels");
    for (let panel of panels) {
      console.log(`Initializing ${panel.name} Panel...`);
      let div = document.createElement("div");
      div.id = `${panel.id}-panel`;
      div.classList.add("panel", panel.id, "content-scroll");
      div.innerHTML = fs.readFileSync(
        `${__dirname}/panels/${panel.id}.html`,
        "utf8"
      );
      panelsElem.appendChild(div);
      new panel().init(this.config);
    }
  }

  async startUpdaterUI() {
    changePanel("config");
  }
}

new UpdaterUI().init();
