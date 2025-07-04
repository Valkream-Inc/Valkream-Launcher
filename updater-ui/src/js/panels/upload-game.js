const { ipcRenderer, shell } = require("electron");
const path = require("path");
import { showSnackbar } from "../utils/utils.js";
const fs = require("fs");

class UploadGamePanel {
  constructor() {
    this.panelContentIcon = document.querySelector(
      "#upload-game-panel-content .material-icons"
    );
    this.init();
  }

  async init() {
    this.appDataPath = await ipcRenderer.invoke("path-app-data");
    this.path = path.join(this.appDataPath, "Valheim Valkream Data");
    if (!fs.existsSync(this.path)) fs.mkdirSync(this.path, { recursive: true });

    this.panelContentIcon.addEventListener("click", () => {
      try {
        shell.openPath(this.path);
        showSnackbar("Dossier ouvert avec succès", "success");
      } catch (error) {
        console.error(error);
        showSnackbar("Erreur lors de l'ouverture du dossier", "error");
      }
    });
  }
}

export default UploadGamePanel;
