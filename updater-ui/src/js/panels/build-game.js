const { ipcRenderer } = require("electron");
const path = require("path");
import Process from "../utils/process.js";
import { database, showSnackbar } from "../utils/utils.js";
const fs = require("fs");
const axios = require("axios");
const yaml = require("yaml");
const { formatBytes } = require("valkream-function-lib");

class BuildGamePanel {
  static id = "build-game-panel";
  constructor() {
    this.runBtn = document.getElementById("run-build-btn-game");
    this.cancelBtn = document.getElementById("cancel-build-btn-game");
    this.versionInput = document.getElementById("build-version-input");
    this.latestBuildGameVersion = document.getElementById(
      "latest-build-game-version"
    );

    // Éléments de progression
    this.progressContainer = document.getElementById(
      "build-progress-container"
    );

    // Instances Process pour chaque étape
    this.processes = {
      main: null,
      config: null,
      plugins: null,
      final: null,
    };

    this.db = new database();
    this.isRunning = false;
    this.isCancelled = false;
    this.currentFileType = null;

    this.init();
  }

  async getOnlineVersion() {
    try {
      const yamlContent = (
        await axios.get(`${this.config.serverUrl}/game/latest/latest.yml`)
      ).data.trim();
      const parsed = yaml.parse(yamlContent);
      const version = parsed.version;
      return version;
    } catch (err) {
      return "0.0.0";
    }
  }

  isNewerVersion(local, remote) {
    const localParts = local.split(".").map(Number);
    const remoteParts = remote.split(".").map(Number);
    return (
      localParts[0] > remoteParts[0] ||
      (localParts[0] === remoteParts[0] && localParts[1] > remoteParts[1]) ||
      (localParts[0] === remoteParts[0] &&
        localParts[1] === remoteParts[1] &&
        localParts[2] > remoteParts[2])
    );
  }

  async init() {
    this.config = await this.db.readData("configClient");
    this.onlineVersion = await this.getOnlineVersion();
    this.latestBuildGameVersion.innerHTML = `Latest version : ${this.onlineVersion}`;
    this.appDataPath = await ipcRenderer.invoke("path-app-data");
    this.path = path.join(this.appDataPath, "Valheim Valkream Data");

    this.bindEvents();
  }

  bindEvents() {
    this.runBtn.addEventListener("click", () => {
      if (this.isRunning) return;

      this.version = this.versionInput ? this.versionInput.value : "";
      if (!this.version) {
        showSnackbar("Veuillez entrer une version !", "error");
        return;
      }
      if (!this.version.match(/^\d+\.\d+\.\d+$/)) {
        showSnackbar("Version invalide. Utilisez le format X.Y.Z", "error");
        return;
      }
      if (!this.isNewerVersion(this.version, this.onlineVersion)) {
        showSnackbar(
          "La version locale n'est pas plus récente que celle en ligne.",
          "error"
        );
        return;
      }
      if (!fs.existsSync(path.join(this.path, "BepInEx"))) {
        showSnackbar("Le dossier BepInEx n'existe pas !", "error");
        return;
      }

      this.executeBuildScript();
    });
    this.cancelBtn.addEventListener("click", () => {
      this.cancelBuildScript();
    });
  }

  showProgress() {
    this.progressContainer.style.display = "block";

    // Créer les instances Process pour chaque étape
    this.processes.main = new Process(
      "main-file",
      this.progressContainer,
      "Dossier principal",
      "folder"
    );

    this.processes.config = new Process(
      "config-file",
      this.progressContainer,
      "Configurations",
      "settings"
    );

    this.processes.plugins = new Process(
      "plugins-file",
      this.progressContainer,
      "Plugins",
      "extension"
    );

    this.processes.final = new Process(
      "final-file",
      this.progressContainer,
      "Build final",
      "archive"
    );
  }

  hideProgress() {
    this.progressContainer.style.display = "none";
    // Nettoyer les processus
    this.processes = {
      main: null,
      config: null,
      plugins: null,
      final: null,
    };
  }

  async executeBuildScript() {
    try {
      this.isRunning = true;
      this.isCancelled = false;
      window.isGameProcessRunning = true;
      this.cancelBtn.style = "";
      this.runBtn.disabled = true;
      this.runBtn.innerHTML =
        '<span class="material-icons">hourglass_empty</span> Exécution...';

      this.showProgress();

      // PART 2 : Get the folders to zip
      const configFolderToZip = path.join(this.path, "./BepInEx/config");
      const pluginsFolderToZip = path.join(this.path, "./BepInEx/plugins");

      // PART 3 : Zip the folders
      const buildDir = path.join(this.appDataPath, "build");
      if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir);

      const ValheimValkreamDataZipFilePath = path.join(buildDir, "./game.zip");
      const configFilePath = path.join(buildDir, "./game-config.zip");
      const pluginsFilePath = path.join(buildDir, "./game-plugins.zip");

      // PART 4 : Zip the folders with progress tracking
      ipcRenderer.on(`zip-folder-${BuildGamePanel.id}`, (event, data) => {
        if (this.isCancelled) return;

        if (data.type === "progress") {
          const process = this.processes[this.currentFileType];
          if (process) {
            process.updateProgress(
              data.processedBytes,
              data.totalBytes || 0,
              data.speed || 0,
              data.fileName
            );
          }
        } else if (data.type === "complete") {
          console.log("Zip completed:", data.filePath);
          const process = this.processes[this.currentFileType];
          if (process) {
            process.setStatus({
              text: "Terminé",
              class: "completed",
            });
          }
        }
      });

      // Zip main game folder
      this.currentFileType = "main";
      this.processes.main.setStatus({
        text: "En cours",
        class: "active",
      });
      this.processes.main.updateProgress(
        0,
        0,
        0,
        "Compression du dossier principal..."
      );
      await ipcRenderer.invoke(
        "zip-folder",
        this.path,
        ValheimValkreamDataZipFilePath,
        BuildGamePanel.id
      );

      if (this.isCancelled) return;

      // Zip config folder
      this.currentFileType = "config";
      this.processes.config.setStatus({
        text: "En cours",
        class: "active",
      });
      this.processes.config.updateProgress(
        0,
        0,
        0,
        "Compression des configurations..."
      );
      await ipcRenderer.invoke(
        "zip-folder",
        configFolderToZip,
        configFilePath,
        BuildGamePanel.id
      );

      if (this.isCancelled) return;

      // Zip plugins folder
      this.currentFileType = "plugins";
      this.processes.plugins.setStatus({
        text: "En cours",
        class: "active",
      });
      this.processes.plugins.updateProgress(
        0,
        0,
        0,
        "Compression des plugins..."
      );
      await ipcRenderer.invoke(
        "zip-folder",
        pluginsFolderToZip,
        pluginsFilePath,
        BuildGamePanel.id
      );

      if (this.isCancelled) return;

      // PART 5 : Hash the folders
      this.processes.final.updateProgress(0, 0, 0, "Calcul des hashes...");
      const configHash = await ipcRenderer.invoke(
        "hash-folder",
        configFolderToZip
      );
      const pluginsHash = await ipcRenderer.invoke(
        "hash-folder",
        pluginsFolderToZip
      );

      if (this.isCancelled) return;

      // PART 6 : Create the latest.yaml file
      this.processes.final.updateProgress(
        0,
        0,
        0,
        "Création du fichier de version..."
      );
      const localLatest = {
        version: this.version,
        buildDate: new Date().toISOString(),
        hash: { config: configHash, plugins: pluginsHash },
      };
      fs.writeFileSync(
        path.join(buildDir, "latest.yml"),
        yaml.stringify(localLatest)
      );

      // PART 7 : Zip the build folder
      this.currentFileType = "final";
      this.processes.final.setStatus({
        text: "En cours",
        class: "active",
      });
      this.processes.final.updateProgress(0, 0, 0, "Finalisation du build...");
      const uploadZipPath = path.join(this.appDataPath, "./game-build.zip");
      await ipcRenderer.invoke(
        "zip-folder",
        buildDir,
        uploadZipPath,
        BuildGamePanel.id
      );

      if (this.isCancelled) return;

      // PART 8 : Upload the zip file
      this.processes.final.updateProgress(
        0,
        0,
        0,
        "Build terminé avec succès!"
      );
      this.processes.final.setStatus({
        text: "Terminé",
        class: "completed",
      });
      showSnackbar("Build terminé avec succès!", "success");
    } catch (error) {
      console.error(error);
      if (!this.isCancelled) {
        const process = this.processes[this.currentFileType];
        if (process) {
          process.setStatus({
            text: "Erreur",
            class: "error",
          });
        }
        showSnackbar("Erreur lors du build: " + error.message, "error");
      }
    } finally {
      this.cancelBuildScript();
    }
  }

  cancelBuildScript() {
    this.isRunning = false;
    this.isCancelled = true;
    window.isGameProcessRunning = false;
    this.runBtn.disabled = false;
    this.cancelBtn.style = "display: none;";
    this.runBtn.innerHTML =
      '<span class="material-icons">build</span> Run build';
    this.hideProgress();

    // Annuler le processus de zippage en cours
    if (this.isRunning) {
      ipcRenderer.invoke("cancel-zip-process", BuildGamePanel.id);
    }

    // Nettoyer les listeners
    ipcRenderer.removeAllListeners(`zip-folder-${BuildGamePanel.id}`);

    this.init();
  }
}

export default BuildGamePanel;
