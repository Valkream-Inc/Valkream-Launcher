const { ipcRenderer } = require("electron");
const path = require("path");
import { database, showSnackbar } from "../utils/utils.js";
const fs = require("fs");
const axios = require("axios");
const yaml = require("yaml");

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

    // Éléments pour chaque fichier
    this.progressItems = {
      main: {
        element: document.getElementById("progress-main-file"),
        status: document.getElementById("main-file-status"),
        progress: document.getElementById("main-file-progress"),
        text: document.getElementById("main-file-text"),
        bytes: document.getElementById("main-file-bytes"),
        current: document.getElementById("main-file-current"),
        speed: document.getElementById("main-file-speed"),
      },
      config: {
        element: document.getElementById("progress-config-file"),
        status: document.getElementById("config-file-status"),
        progress: document.getElementById("config-file-progress"),
        text: document.getElementById("config-file-text"),
        bytes: document.getElementById("config-file-bytes"),
        current: document.getElementById("config-file-current"),
        speed: document.getElementById("config-file-speed"),
      },
      plugins: {
        element: document.getElementById("progress-plugins-file"),
        status: document.getElementById("plugins-file-status"),
        progress: document.getElementById("plugins-file-progress"),
        text: document.getElementById("plugins-file-text"),
        bytes: document.getElementById("plugins-file-bytes"),
        current: document.getElementById("plugins-file-current"),
        speed: document.getElementById("plugins-file-speed"),
      },
      final: {
        element: document.getElementById("progress-final-file"),
        status: document.getElementById("final-file-status"),
        progress: document.getElementById("final-file-progress"),
        text: document.getElementById("final-file-text"),
        bytes: document.getElementById("final-file-bytes"),
        current: document.getElementById("final-file-current"),
        speed: document.getElementById("final-file-speed"),
      },
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

  updateProgress(
    fileType,
    fileName,
    bytesProcessed,
    totalBytes = 0,
    speed = 0
  ) {
    const item = this.progressItems[fileType];
    if (!item) return;

    if (fileName) {
      item.current.textContent = fileName;
    }

    if (bytesProcessed !== undefined) {
      const bytesText = this.formatBytes(bytesProcessed);
      item.bytes.textContent = bytesText;
    }

    if (totalBytes > 0) {
      const percentage = Math.round((bytesProcessed / totalBytes) * 100);
      item.progress.style.width = `${percentage}%`;
      item.text.textContent = `${percentage}%`;
    }

    if (speed !== undefined) {
      const speedText = this.formatSpeed(speed);
      item.speed.textContent = speedText;
    }
  }

  setFileStatus(fileType, status) {
    const item = this.progressItems[fileType];
    if (!item) return;

    // Retirer toutes les classes de statut
    item.status.className = "progress-item-status";
    item.element.className = "progress-item";

    switch (status) {
      case "waiting":
        item.status.textContent = "En attente";
        break;
      case "active":
        item.status.textContent = "En cours";
        item.status.classList.add("active");
        item.element.classList.add("active");
        break;
      case "completed":
        item.status.textContent = "Terminé";
        item.status.classList.add("completed");
        item.element.classList.add("completed");
        break;
      case "error":
        item.status.textContent = "Erreur";
        item.status.classList.add("error");
        item.element.classList.add("error");
        break;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return "0 bytes";
    const k = 1024;
    const sizes = ["bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  formatSpeed(bytesPerSecond) {
    if (bytesPerSecond === 0) return "0 B/s";
    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return (
      parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
    );
  }

  showProgress() {
    this.progressContainer.style.display = "block";
    // Initialiser tous les éléments
    Object.keys(this.progressItems).forEach((type) => {
      this.setFileStatus(type, "waiting");
      this.updateProgress(type, "-", 0, 0);
    });
  }

  hideProgress() {
    this.progressContainer.style.display = "none";
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
          this.updateProgress(
            this.currentFileType,
            data.fileName,
            data.processedBytes,
            data.totalBytes,
            data.speed
          );
        } else if (data.type === "complete") {
          console.log("Zip completed:", data.filePath);
          this.setFileStatus(this.currentFileType, "completed");
        }
      });

      // Zip main game folder
      this.currentFileType = "main";
      this.setFileStatus("main", "active");
      this.updateProgress("main", "Compression du dossier principal...", 0);
      await ipcRenderer.invoke(
        "zip-folder",
        this.path,
        ValheimValkreamDataZipFilePath,
        BuildGamePanel.id
      );

      if (this.isCancelled) return;

      // Zip config folder
      this.currentFileType = "config";
      this.setFileStatus("config", "active");
      this.updateProgress("config", "Compression des configurations...", 0);
      await ipcRenderer.invoke(
        "zip-folder",
        configFolderToZip,
        configFilePath,
        BuildGamePanel.id
      );

      if (this.isCancelled) return;

      // Zip plugins folder
      this.currentFileType = "plugins";
      this.setFileStatus("plugins", "active");
      this.updateProgress("plugins", "Compression des plugins...", 0);
      await ipcRenderer.invoke(
        "zip-folder",
        pluginsFolderToZip,
        pluginsFilePath,
        BuildGamePanel.id
      );

      if (this.isCancelled) return;

      // PART 5 : Hash the folders
      this.updateProgress("final", "Calcul des hashes...", 0);
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
      this.updateProgress("final", "Création du fichier de version...", 0);
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
      this.setFileStatus("final", "active");
      this.updateProgress("final", "Finalisation du build...", 0);
      const uploadZipPath = path.join(this.appDataPath, "./game-build.zip");
      await ipcRenderer.invoke(
        "zip-folder",
        buildDir,
        uploadZipPath,
        BuildGamePanel.id
      );

      if (this.isCancelled) return;

      // PART 8 : Upload the zip file
      this.updateProgress("final", "Build terminé avec succès!", 0);
      this.setFileStatus("final", "completed");
      showSnackbar("Build terminé avec succès!", "success");
    } catch (error) {
      console.error(error);
      if (!this.isCancelled) {
        this.setFileStatus(this.currentFileType, "error");
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
  }
}

export default BuildGamePanel;
