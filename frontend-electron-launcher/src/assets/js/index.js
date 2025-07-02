/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { ipcRenderer } = require("electron");

class LoadingPage {
  constructor() {
    this.message = document.querySelector("#loading-message");
    this.loadingSection = document.querySelector("#loading-section");
    this.preloadVideo = document.querySelector("#preload-video");

    document.addEventListener("DOMContentLoaded", () => {
      this.handleVideoEnd();
    });
  }

  handleVideoEnd() {
    if (this.preloadVideo && this.loadingSection) {
      this.preloadVideo.addEventListener("ended", () => {
        this.loadingSection.style.opacity = 1;
        this.preloadVideo.style.display = "none";
        this.checkForUpdates();
      });
    }
  }

  checkForUpdates() {
    ipcRenderer.send("check-for-updates");

    ipcRenderer.on("update_status", (_event, message) => {
      this.setMessage(message);
    });

    ipcRenderer.on("launch_main_window", () => {
      ipcRenderer.send("main-window-open");
      ipcRenderer.send("update-window-close");
    });
  }

  setMessage(text) {
    this.message.innerHTML = text;
  }
}

new LoadingPage();
