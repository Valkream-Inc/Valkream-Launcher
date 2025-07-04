const { ipcRenderer } = require("electron");
import { showSnackbar, database } from "../utils/utils.js";
const { formatBytes } = require("valkream-function-lib");
const path = require("path");

class UploadGamePanel {
  constructor() {
    this.init();
  }

  async init() {
    this.dropzone = document.getElementById("dropzone-upload-game");
    this.fileInput = document.getElementById("file-input-upload-game");
    this.progressBar = document.getElementById("upload-progress-bar");
    this.progressBarInner = document.getElementById(
      "upload-progress-bar-inner"
    );
    this.isRunning = false;
    this.filesToUpload = [];
    this.db = new database();
    this.destinationFolder = path.join(
      (await this.db.readData("configClient")).folderPath,
      "/game-updater/Valheim Valkream Data"
    );
    this.bindEvents();
  }

  bindEvents() {
    this.dropzone.addEventListener("click", () => this.fileInput.click());
    this.fileInput.addEventListener("change", (e) => {
      if (this.isRunning) return;
      this.handleFiles(e.target.files);
    });

    this.dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (this.isRunning) return;
      this.dropzone.classList.add("dragover");
    });
    this.dropzone.addEventListener("dragleave", (e) => {
      e.preventDefault();
      if (this.isRunning) return;
      this.dropzone.classList.remove("dragover");
    });
    this.dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      if (this.isRunning) return;
      this.dropzone.classList.remove("dragover");
      const items = e.dataTransfer.items;
      if (items && items.length > 0) {
        this.getFilesFromItems(items).then((files) => this.handleFiles(files));
      }
    });
  }

  async getFilesFromItems(items) {
    // Récupère tous les fichiers d'un dossier drag & drop
    let files = [];
    for (const item of items) {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        files = files.concat(await this.readEntry(entry));
      }
    }
    return files;
  }

  async readEntry(entry, path = "") {
    // Récursif pour lire tous les fichiers d'un dossier
    return new Promise((resolve) => {
      if (entry.isFile) {
        entry.file((file) => {
          file.relativePath = path + file.name;
          resolve([file]);
        });
      } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        dirReader.readEntries(async (entries) => {
          let files = [];
          for (const ent of entries) {
            files = files.concat(
              await this.readEntry(ent, path + entry.name + "/")
            );
          }
          resolve(files);
        });
      } else {
        resolve([]);
      }
    });
  }

  async handleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    this.isRunning = true;
    window.isGameProcessRunning = true;
    this.progressBar.style.display = "block";
    this.progressBarInner.style.width = "0%";
    this.dropzone.classList.add("disabled");
    this.fileInput.disabled = true;
    this.setDropzoneText("Préparation des fichiers...");

    let files = Array.from(fileList);

    // Détecter le dossier racine commun
    let rootPrefix = null;
    if (files.length > 0) {
      // Prend le chemin relatif du premier fichier
      let rel =
        files[0].webkitRelativePath || files[0].relativePath || files[0].name;
      if (rel.includes("/")) {
        rootPrefix = rel.split("/")[0] + "/";
      }
    }

    // Prépare la liste des chemins sans le dossier racine
    let filesData = files.map((file) => {
      let rel = file.webkitRelativePath || file.relativePath || file.name;
      if (rootPrefix && rel.startsWith(rootPrefix)) {
        rel = rel.slice(rootPrefix.length);
      }
      return {
        path: file.path,
        relativePath: rel,
        size: file.size,
      };
    });

    // Écoute la progression
    const onProgress = (event, data) => {
      if (!data) return;
      const { writtenBytes, totalBytes, percent } = data;
      this.progressBarInner.style.width = percent + "%";
      this.setDropzoneText(
        `${percent}% - ${formatBytes(writtenBytes)}/${formatBytes(totalBytes)}`
      );
    };
    ipcRenderer.on("upload-progress", onProgress);

    try {
      if (rootPrefix !== "Valheim Valkream Data/")
        throw new Error("Le dossier de destination n'est pas correct");

      await ipcRenderer.invoke(
        "upload-folder",
        filesData,
        this.destinationFolder
      );
      this.progressBarInner.style.width = "100%";
      showSnackbar("Upload terminé !", "success");
    } catch (err) {
      showSnackbar("Erreur lors de l'upload", "error");
      console.error("Erreur IPC upload-folder", err);
    } finally {
      setTimeout(() => {
        this.progressBar.style.display = "none";
        this.setDropzoneText(
          "Glissez-déposez le dossier ici ou cliquez pour sélectionner"
        );
        this.dropzone.classList.remove("disabled");
        this.fileInput.disabled = false;
        ipcRenderer.removeListener("upload-progress", onProgress);
        this.isRunning = false;
        window.isGameProcessRunning = false;
      }, 2000);
    }
  }

  setDropzoneText(text) {
    const p = this.dropzone.querySelector("p");
    if (p) p.textContent = text;
  }
}

export default UploadGamePanel;
