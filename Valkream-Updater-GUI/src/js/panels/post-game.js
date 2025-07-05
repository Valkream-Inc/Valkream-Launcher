const { ipcRenderer } = require("electron");
const path = require("path");
import { database } from "../utils/utils.js";

class PostGamePanel {
  static id = "post-game-panel";
  constructor() {
    this.runBtn = document.getElementById("run-post-btn-game");
    this.cancelBtn = document.getElementById("cancel-post-btn-game");
    this.outputContainer = document.querySelector(
      "#post-game-panel .panel-content"
    );
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
    // Créer le conteneur de sortie avec style terminal
    this.outputContainer.style = `
        background-color: #1e1e1e;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        color: #ffffff;
        white-space: pre-wrap;
    `;
  }

  bindEvents() {
    if (this.runBtn) {
      this.runBtn.addEventListener("click", () => {
        if (!this.isRunning) {
          this.executePostScript();
        }
      });
    }
    if (this.cancelBtn) {
      this.cancelBtn.addEventListener("click", () => {
        this.cancelPostScript();
      });
    }
  }

  bindIpcEvents() {
    // Écouter les événements de sortie en temps réel
    ipcRenderer.on(`script-output-${PostGamePanel.id}`, (event, data) => {
      this.appendOutput(data);
    });
  }

  appendOutput(data) {
    if (!this.outputContainer) return;

    // Transformer les retours à la ligne en balises <br>
    const formattedData = data.data.replace(/\n/g, "<br>");

    // Ajouter le contenu avec le type approprié
    const color = data.type === "stderr" ? "#ff6b6b" : "#ffffff";
    this.outputContainer.innerHTML += `<span style="color: ${color}">${formattedData}</span>`;

    // Faire défiler vers le bas
    this.outputContainer.scrollTop = this.outputContainer.scrollHeight;
  }

  async executePostScript() {
    try {
      this.isRunning = true;
      window.isGameProcessRunning = true;
      this.cancelBtn.style = "";
      this.runBtn.disabled = true;
      this.runBtn.innerHTML =
        '<span class="material-icons">hourglass_empty</span> Exécution...';
      this.outputContainer.style.display = "block";
      this.outputContainer.innerHTML =
        '<span style="color: #ffffff">🚀 Démarrage de l\'exécution du script post-game...<br></span>';

      const config = await this.db.readData("configClient");
      const scriptPath = path.join(
        config.folderPath,
        "game-updater/scripts/post-game.js"
      );

      const result = await ipcRenderer.invoke(
        "execute-node-script",
        scriptPath,
        ["--custom", config.serverUrl, config.apiKey, config.apiToken],
        PostGamePanel.id
      );

        if (result.errorOutput) {
          this.appendOutput({
            type: "stderr",
            data: result.errorOutput,
          });
        }
        if (result.output) {
          this.appendOutput({
            type: "stdout",
            data: result.output,
          });
        }

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
      console.error("Erreur fatale :", error);
      this.appendOutput({
        type: "stderr",
        data: `\n💥 Erreur fatale: ${error.message}\n`,
      });
    } finally {
      this.isRunning = false;
      window.isGameProcessRunning = false;
      this.runBtn.disabled = false;
      this.runBtn.innerHTML =
        '<span class="material-icons">send</span> Run post';
      this.cancelBtn.style = "display: none";
    }
  }

  cancelPostScript() {
    ipcRenderer.invoke("cancel-node-script", PostGamePanel.id);
    this.appendOutput({
      type: "stderr",
      data: "\n⏹️ Annulation demandée...\n",
    });
    this.isRunning = false;
    window.isGameProcessRunning = false;
    this.runBtn.disabled = false;
    if (this.cancelBtn) this.cancelBtn.style.display = "none";
    this.runBtn.innerHTML =
      '<span class="material-icons">send</span> Run post';
  }
}

export default PostGamePanel;
