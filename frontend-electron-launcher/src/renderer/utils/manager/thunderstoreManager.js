const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const yaml = require("yaml");
const { ipcRenderer } = require("electron");

const { baseUrl } = require(window.PathsManager.getConstants());
const Manager = require("./manager.js");

class ThunderstoreManager {
  static id = "thunderstore-manager";

  async initThunderstore(gameDir) {
    this.appdataDir = path.join(await ipcRenderer.invoke("data-path"));
    this.serverGameRoot = path.join(baseUrl, "game/latest");

    this.gameVersionFileLink = path.join(this.serverGameRoot, "latest.yml");
    this.gameVersionFilePath = path.join(this.appdataDir, "game", "latest.yml");
    this.gameDir = gameDir;
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

  setLocalVersionConfig(content) {
    return new Manager().handleError({
      ensure: fs.existsSync(this.gameVersionFilePath),
      then: async () => {
        await fs.writeFile(this.gameVersionFilePath, content);
      },
    });
  }

  async downloadModpack(url, destination, callback = () => {}) {
    return new Manager().handleError({
      ensure: fs.existsSync(destination),
      then: async () => {
        ipcRenderer.send(
          "download-multiple-files",
          [
            {
              url: url,
              destPath: destination,
            },
          ],
          ThunderstoreManager.id
        );

        ipcRenderer.on(
          `download-multi-progress-${ThunderstoreManager.id}`,
          (event, data) => {
            callback(...data);
          }
        );
      },
    });
  }

  async unzipModpack(zipPath, destination, callback = () => {}) {
    return new Manager().handleError({
      ensure: fs.existsSync(zipPath),
      then: async () => {
        ipcRenderer.send(
          "multiple-unzip",
          [{ path: zipPath, destPath: destination }],
          ThunderstoreManager.id
        );

        ipcRenderer.on(
          `multi-unzip-progress-${ThunderstoreManager.id}`,
          (event, data) => {
            callback(...data);
          }
        );
      },
    });
  }

  async dowloadMods(mods, callback = () => {}) {}
  async unzipMods(mods, callback = () => {}) {}
}

module.exports = ThunderstoreManager;
