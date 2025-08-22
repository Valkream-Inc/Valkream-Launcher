/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const PathsManager = require("../../../../shared/pathsManager.js");
window.PathsManager = PathsManager;

// import modules
const { changePanel, Logger } = require(PathsManager.getUtils());

// libs
const { ipcRenderer } = require("electron");

class Launcher {
  async init() {
    this.initFrame();
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

  async startLauncher() {
    changePanel("home");
  }
}

new Launcher().init();
