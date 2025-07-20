const axios = require("axios");
const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const yaml = require("yaml");
const { ipcRenderer } = require("electron");

const Manager = require("./manager.js");
const VersionManager = require("./versionManager.js");

class ThunderstoreManager {
  static id = "thunderstore-manager";

  async init() {
    this.appdataDir = path.join(await ipcRenderer.invoke("data-path"));
    this.gameDir = path.join(this.appdataDir, "game", "Valheim");

    this.BepInExDir = path.join(this.gameDir, "BepInEx");
    this.BepInExConfigDir = path.join(this.BepInExDir, "config");
    this.BepInExPluginsDir = path.join(this.BepInExDir, "plugins");

    this.ModPackDir = path.join(this.appdataDir, "game", "Modpack");
    this.modsDir = path.join(this.ModPackDir, "mods");

    this.modpackZipLink = await VersionManager.toURL(
      (
        await VersionManager.getOnlineVersionConfig()
      ).modpack.dowload_url
    );
    this.modpackZipPath = path.join(this.appdataDir, "game", "modpack.zip");

    for (const dir of [
      this.appdataDir,
      this.gameDir,
      this.BepInExDir,
      this.BepInExConfigDir,
      this.BepInExPluginsDir,
      this.ModPackDir,
      this.modsDir,
    ]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  async downloadModpack(
    callback = (text, downloadedBytes, totalBytes, percent, speed) => {},
    text = "Téléchargement du modpack..."
  ) {
    return new Manager().handleError({
      ensure: fs.existsSync(this.gameDir),
      then: async () => {
        return new Promise((resolve, reject) => {
          ipcRenderer.invoke(
            "download-multiple-files",
            [
              {
                url: this.modpackZipLink,
                destPath: this.modpackZipPath,
              },
            ],
            ThunderstoreManager.id + "-download-modpack"
          );

          const progressListener = (event, data) => {
            callback(
              text,
              data.downloadedBytes,
              data.totalBytes,
              data.percent,
              data.speed
            );
            if (data.downloadedBytes === data.totalBytes) {
              ipcRenderer.removeListener(
                `download-multi-progress-${ThunderstoreManager.id}-download-modpack`,
                progressListener
              );
              resolve(true);
            }
          };

          ipcRenderer.on(
            `download-multi-progress-${ThunderstoreManager.id}-download-modpack`,
            progressListener
          );
        });
      },
    });
  }

  async unzipModpack(
    callback = (text, decompressedBytes, totalBytes, percent, speed) => {},
    text = "Décompression du modpack..."
  ) {
    return new Manager().handleError({
      ensure: fs.existsSync(this.modpackZipPath),
      then: async () => {
        return new Promise((resolve, reject) => {
          ipcRenderer.invoke(
            "multiple-unzip",
            [
              {
                path: this.modpackZipPath,
                destPath: this.ModPackDir,
              },
            ],
            ThunderstoreManager.id + "-unzip-modpack"
          );

          const progressListener = (event, data) => {
            callback(
              text,
              data.decompressedBytes,
              data.totalBytes,
              data.percent,
              data.speed
            );
            if (data.decompressedBytes === data.totalBytes) {
              ipcRenderer.removeListener(
                `multi-unzip-progress-${ThunderstoreManager.id}-unzip-modpack`,
                progressListener
              );

              fse.moveSync(
                path.join(this.ModPackDir, "config"),
                this.BepInExConfigDir,
                { overwrite: true, force: true }
              );
              fs.unlinkSync(this.modpackZipPath);
              resolve(true);
            }
          };

          ipcRenderer.on(
            `multi-unzip-progress-${ThunderstoreManager.id}-unzip-modpack`,
            progressListener
          );
        });
      },
    });
  }

  async dowloadMods(
    callback = (text, downloadedBytes, totalBytes, percent, speed) => {},
    text = "Téléchargement des mods..."
  ) {
    return new Manager().handleError({
      ensure:
        fs.existsSync(this.gameDir) &&
        fs.existsSync(path.join(this.ModPackDir, "manifest.json")),
      then: async () => {
        const manifest = JSON.parse(
          fs.readFileSync(path.join(this.ModPackDir, "manifest.json"), "utf-8")
        );
        const mods = manifest.dependencies || [];

        return new Promise((resolve, reject) => {
          ipcRenderer.invoke(
            "download-multiple-files",
            mods.map((mod) => ({
              url: this.getModInfos(mod).url,
              destPath: path.join(this.modsDir, mod + ".zip"),
            })),
            ThunderstoreManager.id + "-download-mods"
          );

          const progressListener = (event, data) => {
            callback(
              text,
              data.downloadedBytes,
              data.totalBytes,
              data.percent,
              data.speed
            );
            if (data.downloadedBytes === data.totalBytes) {
              ipcRenderer.removeListener(
                `download-multi-progress-${ThunderstoreManager.id}-download-mods`,
                progressListener
              );
              resolve(true);
            }
          };

          ipcRenderer.on(
            `download-multi-progress-${ThunderstoreManager.id}-download-mods`,
            progressListener
          );
        });
      },
    });
  }

  async unzipMods(
    callback = (text, decompressedBytes, totalBytes, percent, speed) => {},
    text = "Décompression des mods..."
  ) {
    return new Manager().handleError({
      ensure: fs.existsSync(this.ModPackDir),
      then: async () => {
        const mods = fs.readdirSync(this.modsDir);
        return new Promise((resolve, reject) => {
          ipcRenderer.invoke(
            "multiple-unzip",
            mods.map((mod) => ({
              path: path.join(this.modsDir, mod),
              destPath: path.join(this.BepInExPluginsDir, mod),
            })),
            ThunderstoreManager.id + "-unzip-mods"
          );

          const progressListener = (event, data) => {
            callback(
              text,
              data.decompressedBytes,
              data.totalBytes,
              data.percent,
              data.speed
            );
            if (data.decompressedBytes === data.totalBytes) {
              ipcRenderer.removeListener(
                `multi-unzip-progress-${ThunderstoreManager.id}-unzip-mods`,
                progressListener
              );
              // Suppression des archives zip des mods si besoin :
              mods.forEach((mod) => {
                const modZip = path.join(this.modsDir, mod);
                if (fs.existsSync(modZip)) {
                  fs.unlinkSync(modZip);
                }
              });
              resolve(true);
            }
          };

          ipcRenderer.on(
            `multi-unzip-progress-${ThunderstoreManager.id}-unzip-mods`,
            progressListener
          );
        });
      },
    });
  }

  getModInfos(modName) {
    if (!modName) return {};
    const [author, name, version] = modName.split("-");
    return {
      url: `https://thunderstore.io/package/download/${author}/${name}/${version}/`,
      author,
      name,
      version,
    };
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
module.exports = thunderstoreManager;
