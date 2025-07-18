const axios = require("axios");
const fs = require("fs");
const path = require("path");
const yaml = require("yaml");
const { ipcRenderer } = require("electron");

const { baseUrl } = require(window.PathsManager.getConstants());
const Manager = require("./manager.js");
const { hashFolder } = require("valkream-function-lib");

class ThunderstoreManager {
  static id = "thunderstore-manager";

  async init() {
    this.appdataDir = path.join(await ipcRenderer.invoke("data-path"));
    this.serverGameRoot = path.join(baseUrl, "game/latest");

    this.gameVersionFileLink = path.join(this.serverGameRoot, "latest.yml");
    this.gameVersionFilePath = path.join(this.appdataDir, "game", "latest.yml");

    this.gameDir = path.join(this.appdataDir, "game", "Valheim");

    for (const dir of [this.appdataDir, this.gameDir]) {
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
          ThunderstoreManager.id + "-download-modpack"
        );

        ipcRenderer.on(
          `download-multi-progress-${ThunderstoreManager.id}-download-modpack`,
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
          ThunderstoreManager.id + "-unzip-modpack"
        );

        ipcRenderer.on(
          `multi-unzip-progress-${ThunderstoreManager.id}-unzip-modpack`,
          (event, data) => {
            callback(...data);
          }
        );
      },
    });
  }

  async dowloadMods(mods, callback = () => {}) {
    return new Manager().handleError({
      ensure: fs.existsSync(this.gameDir),
      then: async () => {
        ipcRenderer.send(
          "download-multiple-files",
          mods.map((mod) => ({
            url: this.getModInfos(mod.name).then((mod) => mod.url),
            destPath: path.join(this.serverGameRoot, "mods", mod.name),
          })),
          ThunderstoreManager.id + "-download-mods"
        );

        ipcRenderer.on(
          `download-multi-progress-${ThunderstoreManager.id}-download-mods`,
          (event, data) => {
            callback(...data);
          }
        );
      },
    });
  }

  async unzipMods(mods, callback = () => {}) {
    return new Manager().handleError({
      ensure: fs.existsSync(this.gameDir),
      then: async () => {
        ipcRenderer.send(
          "multiple-unzip",
          mods.map((mod) => ({
            path: path.join(this.serverGameRoot, "mods", mod.name),
            destPath: path.join(this.gameDir, "BepInEx", "plugins", mod.name),
          })),
          ThunderstoreManager.id + "-unzip-mods"
        );

        ipcRenderer.on(
          `multi-unzip-progress-${ThunderstoreManager.id}-unzip-mods`,
          (event, data) => {
            callback(...data);
          }
        );
      },
    });
  }

  getModInfos(modName) {
    const [author, name, version] = modName.split("-");

    return new Manager().handleError({
      ensure: author && name && version,
      then: () => {
        return {
          url: `https://thunderstore.io/package/download/${author}/${name}/${version}/`,
          author,
          name,
          version,
        };
      },
    });
  }

  async ckeckPluginsAndConfig() {
    return new Manager().handleError({
      ensure: fs.existsSync(this.gameDir),
      then: async () => {
        const pluginsDir = await fs.readdir(
          path.join(this.gameDir, "BepInEx", "plugins")
        );
        const configsDir = await fs.readdir(
          path.join(this.gameDir, "BepInEx", "config")
        );

        const pluginsHash = hashFolder(pluginsDir);
        const configsHash = hashFolder(configsDir);

        if (
          pluginsHash !== this.getOnlineVersionConfig().hash.plugins ||
          configsHash !== this.getOnlineVersionConfig().hash.config
        )
          throw new Error("Plugins or configs are not up to date");
      },
    });
  }
}

const thunderstoreManager = new ThunderstoreManager();
thunderstoreManager.init();
module.exports = thunderstoreManager;
