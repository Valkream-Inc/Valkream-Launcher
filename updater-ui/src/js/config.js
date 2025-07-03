const { ipcRenderer } = require("electron");
import { database, showSnackbar, changePage } from "./utils/utils.js";
const fs = require("fs");

class Config {
  static id = "config";

  async init() {
    this.db = new database();
    await this.initializeClientConfig();
    await this.loadConfig();
    document
      .getElementById("config-form")
      .addEventListener("submit", this.saveConfig.bind(this));
    document
      .getElementById("reset-btn")
      .addEventListener("click", () => this.resetForm());
    document
      .getElementById("choose-folder")
      .addEventListener("click", this.chooseFolder.bind(this));
  }

  DEFAULTS = {
    apiKey: "API_KEY",
    apiToken: "API_TOKEN",
    serverUrl: "http://localhost:3000",
    folderPath: "C:\\code\\Valkream-Launcher",
  };

  async initializeClientConfig() {
    console.log("Initializing Config Client...");
    let configData = await this.db.readData("configClient");
    if (!configData) await this.db.createData("configClient", DEFAULTS);
  }

  async loadConfig() {
    let configData = await this.db.readData("configClient");
    document.getElementById("apiKey").value = configData.apiKey;
    document.getElementById("apiToken").value = configData.apiToken;
    document.getElementById("serverUrl").value = configData.serverUrl;
    document.getElementById("folderPath").value = configData.folderPath;
    this.checkUrlWarning(configData.serverUrl);
    document.getElementById("serverUrl").addEventListener("input", (e) => {
      this.checkUrlWarning(e.target.value);
    });
  }

  checkUrlWarning(url) {
    const warningDiv = document.getElementById("url-warning");
    if (!url.includes("localhost")) {
      warningDiv.style.display = "block";
      warningDiv.textContent =
        "Attention : Vous utilisez une URL serveur externe.";
    } else {
      warningDiv.style.display = "none";
      warningDiv.textContent = "";
    }
  }

  async chooseFolder() {
    const folder = await ipcRenderer.invoke("show-open-dialog");
    if (folder && folder.filePaths[0])
      document.getElementById("folderPath").value = folder.filePaths[0];
  }

  async saveConfig(e) {
    e.preventDefault();
    const apiKey = document.getElementById("apiKey").value;
    const apiToken = document.getElementById("apiToken").value;
    const serverUrl = document.getElementById("serverUrl").value;
    const folderPath = document.getElementById("folderPath").value;

    if (
      fs.existsSync(folderPath) &&
      fs.existsSync(folderPath + "/package.json")
    ) {
      const packageJson = JSON.parse(
        fs.readFileSync(folderPath + "/package.json", "utf8")
      );
      if (packageJson.name === "Updater-Saver-Game-Launcher-Valkream") {
        await this.db.updateData("configClient", {
          apiKey: apiKey,
          apiToken: apiToken,
          serverUrl: serverUrl,
          folderPath: folderPath,
        });

        showSnackbar("Configuration enregistrée !", "success");
        return await changePage("home");
      } else showSnackbar("Le dossier n'est pas un projet Valkream !", "error");
    } else showSnackbar("Le dossier n'est pas un projet Valkream !", "error");
    return;
  }

  resetForm() {
    document.getElementById("apiKey").value = this.DEFAULTS.apiKey;
    document.getElementById("apiToken").value = this.DEFAULTS.apiToken;
    document.getElementById("serverUrl").value = this.DEFAULTS.serverUrl;
    document.getElementById("folderPath").value = this.DEFAULTS.folderPath;
    this.checkUrlWarning(this.DEFAULTS.serverUrl);
  }
}

export default Config;
