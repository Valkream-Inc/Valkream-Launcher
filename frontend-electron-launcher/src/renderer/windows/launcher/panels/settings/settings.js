/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const {
  changePanel,
  showSnackbar,
  LauncherManager,
  GameManager,
  Manager,
} = require(window.PathsManager.getUtils());
const { database } = require(window.PathsManager.getSharedUtils());
const { ipcRenderer } = require("electron");

const GameTab = require("./gameTab.js");
class Settings {
  static id = "settings";
  async init() {
    this.db = new database();
    this.navBTN();
    this.activeDevTab();

    this.changeIsMusicEnabled();
    this.uninstallGame();
    this.uninstallLauncher();
    this.clearCache();
    this.openGameFolder();
    this.openLauncherFolder();
    this.handleLauncherBehavior();
    this.handleCustomGamePath();
    this.enabledAdmin();
    this.toggleLaunchSteam();
    this.enabledBoostFPS();
    this.openDevTools();

    this.gameTab = new GameTab();
    document.querySelector("#game").addEventListener("click", () => {
      this.gameTab.reload();
    });
  }

  buttonAction(btn, action, message, onSuccess = () => {}) {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      message.wait ? (btn.innerHTML = message.wait) : () => {};
      if (await action()) {
        showSnackbar(message.success || "Sucessfully saved !");
        onSuccess();
      } else {
        showSnackbar(message.error || "Error while saving !", "error");
      }
      btn.disabled = false;
      message.base ? (btn.innerHTML = message.base) : () => {};
    });
  }

  changeIsMusicEnabled() {
    const videoBackground = document.getElementById("background-video");
    const musicToggle = document.querySelector(".video-music-toggle");

    musicToggle.checked = !videoBackground.muted;
    musicToggle.addEventListener("change", async (e) => {
      try {
        let configData = await this.db.readData("configClient");
        configData.launcher_config.musicEnabled = !e.target.checked;

        await this.db.updateData("configClient", configData);
        videoBackground.muted = !e.target.checked;
        showSnackbar(
          e.target.checked ? "Musique activée !" : "Musique désactivée !"
        );
      } catch (err) {
        console.error(err);
        showSnackbar("Erreur lors de la sauvegarde !", "error");
      }
    });
  }

  async handleLauncherBehavior() {
    const select = document.querySelector(".launcher-behavior-select");

    const configData = await this.db.readData("configClient");
    if (configData?.launcher_config?.launcherBehavior)
      select.value = configData.launcher_config.launcherBehavior;

    select.addEventListener("change", async (e) => {
      try {
        let configData = await this.db.readData("configClient");
        configData.launcher_config.launcherBehavior = e.target.value;
        await this.db.updateData("configClient", configData);
        showSnackbar("Comportement du launcher sauvegardé !");
      } catch (err) {
        console.error(err);
        showSnackbar("Erreur lors de la sauvegarde !", "error");
      }
    });
  }

  async handleCustomGamePath() {
    const input = document.querySelector(".custom-game-path");

    const configData = await this.db.readData("configClient");
    if (configData?.launcher_config?.customGamePath)
      input.value = configData.launcher_config.customGamePath;

    return this.buttonAction(
      document.querySelector("#choose-game-path-btn"),
      async () => {
        const result = await ipcRenderer.invoke("choose-folder");
        input.value = result;
        let configData = await this.db.readData("configClient");
        configData.launcher_config.customGamePath = result;
        await this.db.updateData("configClient", configData);
        await GameManager.uninstall();
        return true;
      },
      {
        base: "Choisir...",
        wait: "Choix en cours...",
        success: "Chemin personnalisé sauvegardé !",
        error: "Chemin personnalisé non sauvegardé !",
      },
      async () => {
        if (window.updateMainButton) await window.updateMainButton();
      }
    );
  }

  async enabledAdmin() {
    const adminToggle = document.querySelector(".enabled-admin");

    const configData = await this.db.readData("configClient");
    if (configData?.launcher_config?.adminEnabled)
      adminToggle.checked = configData.launcher_config.adminEnabled;

    adminToggle.addEventListener("change", async (e) => {
      try {
        let configData = await this.db.readData("configClient");
        configData.launcher_config.adminEnabled = e.target.checked;
        await this.db.updateData("configClient", configData);

        if (window.updateMainButton) await window.updateMainButton();
        showSnackbar(
          e.target.checked
            ? "Options admin activées !"
            : "Options admin désactivées !"
        );
      } catch (err) {
        console.error(err);
        if (window.updateMainButton) await window.updateMainButton();
        showSnackbar(
          "Erreur lors de l'activation des options admin !",
          "error"
        );
      }
    });
  }

  async toggleLaunchSteam() {
    const steamToggle = document.querySelector(".launch-steam-toggle");

    const configData = await this.db.readData("configClient");
    if (configData?.launcher_config?.launchSteam)
      steamToggle.checked = configData.launcher_config.launchSteam;

    steamToggle.addEventListener("change", async (e) => {
      try {
        let configData = await this.db.readData("configClient");
        configData.launcher_config.launchSteam = e.target.checked;
        await this.db.updateData("configClient", configData);

        showSnackbar(
          e.target.checked
            ? "Steam sera lancé avec le jeu."
            : "Steam ne sera pas lancé au démarrage du jeu."
        );
      } catch (err) {
        console.error(err);
        showSnackbar(
          "Erreur lors de la modification de l'option Steam !",
          "error"
        );
      }
    });
  }

  async enabledBoostFPS() {
    const boostfpsToggle = document.querySelector(".enabled-boostfps");

    const configData = await this.db.readData("configClient");
    if (configData?.launcher_config?.boostfpsEnabled)
      boostfpsToggle.checked = configData.launcher_config.boostfpsEnabled;

    boostfpsToggle.addEventListener("change", async (e) => {
      try {
        let configData = await this.db.readData("configClient");
        configData.launcher_config.boostfpsEnabled = e.target.checked;
        await this.db.updateData("configClient", configData);

        if (window.updateMainButton) await window.updateMainButton();
        showSnackbar(
          e.target.checked
            ? "Options pour booster les FPS activées !"
            : "Options pour booster les FPS désactivées !"
        );
      } catch (err) {
        console.error(err);
        if (window.updateMainButton) await window.updateMainButton();
        showSnackbar(
          "Erreur lors de l'activation des options pour booster les FPS !",
          "error"
        );
      }
    });
  }

  uninstallGame() {
    return this.buttonAction(
      document.querySelector("#uninstall-game"),
      async () => await GameManager.uninstall(),
      {
        base: "Deinstaller",
        wait: "Deinstallation...",
        success: "Application supprimée !",
        error: "Application non installé !",
      },
      async () => {
        if (window.updateMainButton) await window.updateMainButton();
      }
    );
  }

  uninstallLauncher() {
    return this.buttonAction(
      document.querySelector("#uninstall-launcher"),
      async () => {
        await GameManager.uninstall();
        return await LauncherManager.uninstall();
      },
      {
        base: "Désinstaller",
        wait: "Désinstallation...",
        success: "Application supprimée !",
        error: "Application non supprimée !",
      }
    );
  }

  clearCache() {
    return this.buttonAction(
      document.querySelector("#close-cache"),
      async () => await GameManager.clean(),
      {
        base: "Vider le cache",
        wait: "Vidange du cache...",
        success: "Cache du jeu vidée !",
        error: "Cache du jeu non vidée !",
      }
    );
  }

  openLauncherFolder() {
    return this.buttonAction(
      document.querySelector("#open-launcher-folder"),
      async () => await LauncherManager.openInstallationFolder(),
      {
        base: "Ouvrir le dossier du launcher",
        wait: "Ouverture du dossier du launcher...",
        success: "Dossier de l'application ouvert !",
        error: "Dossier de l'application non ouvert !",
      }
    );
  }

  openGameFolder() {
    return this.buttonAction(
      document.querySelector("#open-game-folder"),
      async () => await GameManager.openFolder(),
      {
        base: "Ouvrir le dossier du jeu",
        wait: "Ouverture du dossier du jeu...",
        success: "Dossier du jeu ouvert !",
        error: "Dossier du jeu non ouvert !",
      }
    );
  }

  openDevTools() {
    return this.buttonAction(
      document.querySelector("#open-devTools"),
      async () =>
        new Manager().handleError({
          ensure: true,
          then: async () => {
            return await ipcRenderer.send("main-window-open-devTools");
          },
        }),
      {
        base: "Ouvrir le debug",
        wait: "Ouverture du debug...",
        success: "Debug ouvert !",
        error: "Debug non ouvert !",
      }
    );
  }

  activeDevTab() {
    const devBtn = document.querySelector("#dev");
    const adminBox = document.querySelector("#admin-box");
    const gameBtn = document.querySelector("#game");

    const toggleDevBtn = document.querySelector(".enabled-dev");
    toggleDevBtn.checked = false;

    toggleDevBtn.addEventListener("change", async (e) => {
      const style = e.target.checked ? "block" : "none";
      devBtn.style.display = style;
      adminBox.style.display = style;
      gameBtn.style.display = style;
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

        if (id !== "game") this.gameTab.stop();

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
