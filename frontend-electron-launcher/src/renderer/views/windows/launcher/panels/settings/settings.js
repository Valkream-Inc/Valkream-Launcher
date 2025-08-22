/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { changePanel, showSnackbar } = require(window.PathsManager.getUtils());
const { ipcRenderer } = require("electron");

// const GameTab = require("./gameTab.js");
class Settings {
  static id = "settings";
  async init() {
    // this.db = new database();
    this.navBTN();
    this.activeDevTab();

    await this.changeIsMusicEnabled();
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
    this.enabledBeta();

    // this.gameTab = new GameTab();
    // document.querySelector("#game").addEventListener("click", () => {
    //   this.gameTab.reload();
    // });
  }

  buttonAction(btn, action = async () => {}, message, onSuccess) {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      if (message.wait && message.base) btn.innerHTML = message.wait;

      try {
        await action();
        showSnackbar(message.success || "Sucessfully saved !");
        if (onSuccess) await onSuccess();
      } catch (err) {
        console.error(err);
        showSnackbar(message.error || "Error while saving !", "error");
      } finally {
        btn.disabled = false;
        if (message.base) btn.innerHTML = message.base;
        return;
      }
    });
  }

  toggleAction(toggle, action = async () => {}, message, onSuccess) {
    toggle.addEventListener("change", async (e) => {
      toggle.disabled = true;

      try {
        await action(e.target.checked);
        showSnackbar(message?.success || "Sucessfully saved !");
        if (onSuccess) await onSuccess();
      } catch (err) {
        console.error(err);
        showSnackbar(message?.error || "Error while saving !", "error");
      } finally {
        toggle.disabled = false;
        return;
      }
    });
  }

  selectAction(select, action = async () => {}, message, onSuccess) {
    select.addEventListener("change", async (e) => {
      select.disabled = true;

      try {
        await action(e.target.value);
        showSnackbar(message?.success || "Sucessfully saved !");
        if (onSuccess) await onSuccess();
      } catch (err) {
        console.error(err);
        showSnackbar(message?.error || "Error while saving !", "error");
      } finally {
        select.disabled = false;
        return;
      }
    });
  }

  async changeIsMusicEnabled() {
    // elements
    const BackgroundVideo = document.getElementById("background-video");
    const musicToggle = document.querySelector(".video-music-toggle");

    // init
    const musicEnabled = await ipcRenderer.invoke(
      "get-settings",
      "musicEnabled"
    );
    BackgroundVideo.muted = !musicEnabled;
    musicToggle.checked = musicEnabled;

    // listeners
    this.toggleAction(
      musicToggle,
      async (value) => {
        await ipcRenderer.invoke("set-settings", "musicEnabled", value);
        BackgroundVideo.muted = !value;
        return;
      },
      {
        success: "Comportement de la musique sauvegardé !",
        error: "Erreur lors de la sauvegarde du comportement de la musique !",
      }
    );

    // end
    return;
  }

  async handleLauncherBehavior() {
    // elements
    const selectLauncherBehavior = document.querySelector(
      ".launcher-behavior-select"
    );

    // init
    const launcherBehavior = await ipcRenderer.invoke(
      "get-settings",
      "launcherBehavior"
    );
    selectLauncherBehavior.value = launcherBehavior;

    // listeners
    this.selectAction(
      selectLauncherBehavior,
      async (value) => {
        console.log(value);
        await ipcRenderer.invoke("set-settings", "launcherBehavior", value);
      },
      {
        success: "Comportement du launcher sauvegardé !",
        error: "Erreur lors de la sauvegarde du comportement du launcher !",
      }
    );

    // end
    return;
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
    const devToolsBtn = document.querySelector("#open-devTools");

    const messages = {
      base: {
        base: "Ouvrir le debug",
        wait: "Ouverture du debug...",
        success: "Debug ouvert !",
        error: "Debug non ouvert !",
      },
    };

    return this.buttonAction(
      devToolsBtn,
      async () => {
        ipcRenderer.send("main-window-open-devTools");
        return;
      },
      messages
    );
    // return this.buttonAction(devToolsBtn, async () =>
    //   new Manager().handleError({
    //     ensure: true,
    //     then: async () => {
    //       return await ipcRenderer.send("main-window-open-devTools");
    //     },
    //   })
    // );
  }

  async enabledBeta() {
    const betaToggle = document.querySelector(".enabled-beta");

    const configData = await this.db.readData("configClient");
    if (configData?.launcher_config?.betaEnabled)
      betaToggle.checked = configData.launcher_config.betaEnabled;

    betaToggle.addEventListener("change", async (e) => {
      try {
        let configData = await this.db.readData("configClient");
        configData.launcher_config.betaEnabled = e.target.checked;
        await this.db.updateData("configClient", configData);

        if (window.updateMainButton) await window.updateMainButton();
        showSnackbar(
          e.target.checked
            ? "Tests beta activées !"
            : "Tests beta désactivées !"
        );
      } catch (err) {
        console.error(err);
        if (window.updateMainButton) await window.updateMainButton();
        showSnackbar("Erreur lors de l'activation des tests beta !", "error");
      }
    });
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

        // if (id !== "game") this.gameTab.stop();

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
