/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const {
  changePanel,
  showSnackbar,
  LauncherManager,
  GameManager,
} = require(window.PathsManager.getUtils());
const { database } = require(window.PathsManager.getSharedUtils());
const { ipcRenderer } = require("electron");

class Settings {
  static id = "settings";
  async init() {
    this.db = new database();
    this.navBTN();
    this.activeDevTab();

    this.changeIsMusicEnabled();
    this.uninstallGame();

    this.clearCache();
    this.openGameFolder();
    this.openLauncherFolder();
  }

  changeIsMusicEnabled() {
    const videoBackground = document.getElementById("background-video");
    const musicToggle = document.querySelector(".video-music-toggle");

    musicToggle.checked = !videoBackground.muted;
    musicToggle.addEventListener("change", async (e) => {
      let configData = await this.db.readData("configClient");
      configData.launcher_config.musicEnabled = !e.target.checked;

      await this.db.updateData("configClient", configData);
      videoBackground.muted = !e.target.checked;
      showSnackbar(
        e.target.checked ? "Musique activée !" : "Musique désactivée !"
      );
    });
  }

  uninstallGame() {
    const uninstallBtn = document.querySelector("#uninstall-game");

    uninstallBtn.addEventListener("click", async () => {
      uninstallBtn.disabled = true;
      uninstallBtn.innerHTML = "Deinstallation...";
      if (await new LauncherManager().uninstallGame()) {
        showSnackbar("Application supprimée !");
        setTimeout(() => {
          ipcRenderer.invoke("main-window-restart");
        }, 2000);
      } else {
        showSnackbar("Application non installé !", "error");
      }
      uninstallBtn.disabled = false;
      uninstallBtn.innerHTML = "Deinstaller";
    });
  }

  clearCache() {
    const cacheBtn = document.querySelector("#close-cache");

    cacheBtn.addEventListener("click", async () => {
      cacheBtn.disabled = true;
      cacheBtn.innerHTML = "Vidange...";
      await new LauncherManager().clearCache();
      showSnackbar("Cache vidé !");
      cacheBtn.disabled = false;
      cacheBtn.innerHTML = "Vider le cache";
    });
  }

  openLauncherFolder() {
    const openLauncherFolderBtn = document.querySelector(
      "#open-launcher-folder"
    );
    openLauncherFolderBtn.addEventListener("click", async () => {
      if (await new LauncherManager().openInstallationFolder()) {
        showSnackbar("Dossier de l'application ouvert !");
      } else {
        showSnackbar("Dossier de l'application non ouvert !", "error");
      }
    });
  }

  openGameFolder() {
    const openGameFolderBtn = document.querySelector("#open-game-folder");
    openGameFolderBtn.addEventListener("click", async () => {
      if (await GameManager.openFolder()) {
        showSnackbar("Dossier du jeu ouvert !");
      } else {
        showSnackbar("Dossier du jeu non ouvert !", "error");
      }
    });
  }

  activeDevTab() {
    const devBtn = document.querySelector("#dev");
    const toggleDevBtn = document.querySelector(".enabled-dev");
    toggleDevBtn.checked = devBtn.style.display === "block";

    toggleDevBtn.addEventListener("change", async (e) => {
      devBtn.style.display = e.target.checked ? "block" : "none";
    });
  }

  navBTN() {
    document.querySelector(".nav-box").addEventListener("click", (e) => {
      if (e.target.classList.contains("nav-settings-btn")) {
        let id = e.target.id;

        let activeSettingsBTN = document.querySelector(".active-settings-BTN");
        let activeContainerSettings = document.querySelector(
          ".active-container-settings"
        );

        if (id == "save") {
          return changePanel("home");
        }

        if (activeSettingsBTN)
          activeSettingsBTN.classList.toggle("active-settings-BTN");
        e.target.classList.add("active-settings-BTN");

        if (activeContainerSettings)
          activeContainerSettings.classList.toggle("active-container-settings");
        document
          .querySelector(`#${id}-tab`)
          .classList.add("active-container-settings");
      }
    });
  }
}

module.exports = Settings;
