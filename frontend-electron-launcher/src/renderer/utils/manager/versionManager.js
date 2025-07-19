const axios = require("axios");
const fs = require("fs");
const path = require("path");
const yaml = require("yaml");
const { ipcRenderer } = require("electron");

const { baseUrl } = require(window.PathsManager.getConstants());
const Manager = require("./manager.js");

class VersionManager {
  static id = "version-manager";

  async init() {
    this.appdataDir = path.join(await ipcRenderer.invoke("data-path"));
    this.serverGameRoot = path.join(baseUrl, "game/latest");

    this.gameVersionFileLink = path.join(this.serverGameRoot, "latest.yml");
    this.gameVersionFilePath = path.join(this.appdataDir, "game", "latest.yml");

    for (const dir of [this.appdataDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  async getOnlineVersionConfig() {
    return new Manager().handleError({
      ensure: fs.existsSync(this.gameVersionFilePath),
      then: async () => {
        const yamlContent = (
          await axios.get(this.gameVersionFileLink)
        ).data.trim();
        const parsed = yaml.parse(yamlContent);
        return parsed;
      },
    });
  }

  async getLocalVersionConfig() {
    return new Manager().handleError({
      ensure: fs.existsSync(this.gameVersionFilePath),
      then: async () => {
        const yamlContent = fs
          .readFileSync(this.gameVersionFilePath, "utf8")
          .trim();
        const parsed = yaml.parse(yamlContent);
        return parsed;
      },
    });
  }

  async isVersionUpToDate() {
    const localVersionConfig = await this.getLocalVersionConfig();
    const onlineVersionConfig = await this.getOnlineVersionConfig();
    return localVersionConfig.version === onlineVersionConfig.version;
  }

  async setLocalVersionConfig(content = this.getOnlineVersionConfig()) {
    return await new Manager().handleError({
      ensure: fs.existsSync(this.gameVersionFilePath),
      then: async () => {
        fs.writeFileSync(this.gameVersionFilePath, content);
      },
    });
  }
}

const versionManager = new VersionManager();
versionManager.init();
module.exports = versionManager;
