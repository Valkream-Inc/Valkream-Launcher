const { ipcRenderer } = require("electron");
const path = require("path");
import { database, showSnackbar } from "../utils/utils.js";

class BuildGamePanel {
  static id = "build-game-panel";
  constructor() {
    this.runBtn = document.getElementById("run-build-btn-game");
    this.cancelBtn = document.getElementById("cancel-build-btn-game");
    this.outputContainer = document.querySelector(
      "#build-game-panel .panel-content"
    );
    this.versionInput = document.getElementById("build-version-input");
    this.db = new database();
    this.isRunning = false;
    this.init();
  }

  init() {
    this.createOutputContainer();
    this.bindEvents();
    this.bindIpcEvents();
  }

  createOutputContainer() {
    this.outputContainer.style = `
        background-color: #1e1e1e;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: #ffffff;
        white-space: pre-wrap;
        max-height: calc(80vh - 7.3cm - 56px);
    `;
  }

  bindEvents() {
    if (this.runBtn) {
      this.runBtn.addEventListener("click", () => {
        if (!this.isRunning) {
          this.version = this.versionInput ? this.versionInput.value : "";
          if (!this.version) {
            showSnackbar("Veuillez entrer une version !", "error");
            return;
          }
          this.executeBuildScript();
        }
      });
    }
    this.cancelBtn.addEventListener("click", () => {
      this.cancelBuildScript();
    });
  }

  bindIpcEvents() {
    ipcRenderer.on(`script-output-${BuildGamePanel.id}`, (event, data) => {
      this.appendOutput(data);
    });
  }

  appendOutput(data) {
    if (!this.outputContainer) return;
    const formattedData = data.data.replace(/\n/g, "<br>");
    const color = data.type === "stderr" ? "#ff6b6b" : "#ffffff";
    this.outputContainer.innerHTML += `<span style="color: ${color}">${formattedData}</span>`;
    this.outputContainer.scrollTop = this.outputContainer.scrollHeight;
  }

  async executeBuildScript() {
    try {
      this.isRunning = true;
      window.isGameProcessRunning = true;
      this.cancelBtn.style = "";
      this.runBtn.disabled = true;
      this.runBtn.innerHTML =
        '<span class="material-icons">hourglass_empty</span> Exécution...';
      this.outputContainer.style.display = "block";
      this.outputContainer.innerHTML =
        '<span style="color: #ffffff">🚀 Démarrage de l\'exécution du script build-game...<br></span>';
      const config = await this.db.readData("configClient");
      const scriptPath = path.join(
        config.folderPath,
        "game-updater/scripts/build-game.js"
      );
      const result = await ipcRenderer.invoke(
        "execute-node-script",
        scriptPath,
        ["--custom", config.serverUrl, this.version],
        BuildGamePanel.id
      );
      if (!result.success) {
        if (result.signal) {
          this.appendOutput({
            type: "stderr",
            data: `\n⏹️ Script annulé par signal (${result.signal})\n`,
          });
        } else {
          this.appendOutput({
            type: "stderr",
            data: `\n❌ Erreur lors de l'exécution du script ! (Code: ${result.exitCode})\n`,
          });
        }
      }
    } catch (error) {
      this.appendOutput({
        type: "stderr",
        data: `\n💥 Erreur fatale: ${error.message}\n`,
      });
    } finally {
      this.isRunning = false;
      window.isGameProcessRunning = false;
      this.runBtn.disabled = false;
      this.runBtn.innerHTML =
        '<span class="material-icons">build</span> Run build';
      this.cancelBtn.style = "display: none";
    }
  }

  cancelBuildScript() {
    ipcRenderer.invoke("cancel-node-script", BuildGamePanel.id);
    this.appendOutput({
      type: "stderr",
      data: "\n⏹️ Annulation demandée...\n",
    });
    this.isRunning = false;
    window.isGameProcessRunning = false;
    this.runBtn.disabled = false;
    if (this.cancelBtn) this.cancelBtn.style.display = "none";
    this.runBtn.innerHTML =
      '<span class="material-icons">build</span> Run build';
  }
}

export default BuildGamePanel;
