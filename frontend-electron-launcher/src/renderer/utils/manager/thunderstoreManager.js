const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const { ipcRenderer } = require("electron");
const { hashFolder } = require("valkream-function-lib");

const Manager = require("./manager.js");
const { database } = require(PathsManager.getSharedUtils());
const VersionManager = require("./versionManager.js");
const GameManager = require("./gameManager.js");

class ThunderstoreManager {
  static id = "thunderstore-manager";

  constructor() {
    this.db = new database();
  }

  async init() {
    this.appdataDir =
      (await this.db.readData("configClient"))?.launcher_config
        ?.customGamePath || path.join(await ipcRenderer.invoke("data-path"));
    this.gameRootDir = path.join(this.appdataDir, "game");
    this.gameDir = path.join(this.gameRootDir, "Valheim");

    this.BepInExDir = path.join(this.gameDir, "BepInEx");
    this.BepInExConfigDir = path.join(this.BepInExDir, "config");
    this.BepInExPluginsDir = path.join(this.BepInExDir, "plugins");

    this.ModPackDir = path.join(this.appdataDir, "game", "Modpack");
    this.modsDir = path.join(this.ModPackDir, "mods");

    this.manifestPath = path.join(this.appdataDir, "game", "modpack.json");
    this.newManifestPath = path.join(this.ModPackDir, "manifest.json");

    if (window.isServerReachable) {
      this.modpackZipLink = await VersionManager.toURL(
        (
          await VersionManager.getOnlineVersionConfig()
        ).modpack.dowload_url
      );
      this.modpackZipPath = path.join(this.appdataDir, "game", "modpack.zip");
    }

    this.modsAdmin = (
      await VersionManager.getLocalVersionConfig()
    ).modpack?.admin_mods;

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
          };

          const finishedListener = () => {
            ipcRenderer.removeListener(
              `download-multi-progress-${ThunderstoreManager.id}-download-modpack`,
              progressListener
            );
            ipcRenderer.removeListener(
              `download-multi-finished-${ThunderstoreManager.id}-download-modpack`,
              finishedListener
            );
            resolve(true);
          };

          ipcRenderer.on(
            `download-multi-progress-${ThunderstoreManager.id}-download-modpack`,
            progressListener
          );
          ipcRenderer.once(
            `download-multi-finished-${ThunderstoreManager.id}-download-modpack`,
            finishedListener
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
          };

          const finishedListener = () => {
            ipcRenderer.removeListener(
              `multi-unzip-progress-${ThunderstoreManager.id}-unzip-modpack`,
              progressListener
            );
            ipcRenderer.removeListener(
              `multi-unzip-finished-${ThunderstoreManager.id}-unzip-modpack`,
              finishedListener
            );
            fse.moveSync(
              path.join(this.ModPackDir, "config"),
              this.BepInExConfigDir,
              { overwrite: true, force: true }
            );
            fs.unlinkSync(this.modpackZipPath);
            resolve(true);
          };

          ipcRenderer.on(
            `multi-unzip-progress-${ThunderstoreManager.id}-unzip-modpack`,
            progressListener
          );
          ipcRenderer.once(
            `multi-unzip-finished-${ThunderstoreManager.id}-unzip-modpack`,
            finishedListener
          );
        });
      },
    });
  }

  async dowloadMods(
    callback = (text, downloadedBytes, totalBytes, percent, speed) => {},
    text = "Téléchargement des mods...",
    customMods = null
  ) {
    return new Manager().handleError({
      ensure:
        fs.existsSync(this.gameDir) &&
        (fs.existsSync(this.newManifestPath) || customMods),
      then: async () => {
        let manifest;
        if (fs.existsSync(this.newManifestPath)) {
          manifest = JSON.parse(fs.readFileSync(this.newManifestPath, "utf-8"));

          fse.moveSync(this.newManifestPath, this.manifestPath, {
            overwrite: true,
            force: true,
          });
        }

        const mods = customMods || manifest.dependencies || [];

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
          };

          const finishedListener = () => {
            ipcRenderer.removeListener(
              `download-multi-progress-${ThunderstoreManager.id}-download-mods`,
              progressListener
            );
            ipcRenderer.removeListener(
              `download-multi-finished-${ThunderstoreManager.id}-download-mods`,
              finishedListener
            );
            resolve(true);
          };

          ipcRenderer.on(
            `download-multi-progress-${ThunderstoreManager.id}-download-mods`,
            progressListener
          );
          ipcRenderer.once(
            `download-multi-finished-${ThunderstoreManager.id}-download-mods`,
            finishedListener
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
      ensure:
        fs.existsSync(this.modsDir) && fs.existsSync(this.BepInExPluginsDir),
      then: async () => {
        const mods = fs.readdirSync(this.modsDir);
        return new Promise((resolve, reject) => {
          ipcRenderer.invoke(
            "multiple-unzip",
            mods.map((mod) => ({
              path: path.join(this.modsDir, mod),
              destPath: path.join(
                this.BepInExPluginsDir,
                mod.replace(".zip", "")
              ),
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
          };

          const finishedListener = () => {
            ipcRenderer.removeListener(
              `multi-unzip-progress-${ThunderstoreManager.id}-unzip-mods`,
              progressListener
            );
            ipcRenderer.removeListener(
              `multi-unzip-finished-${ThunderstoreManager.id}-unzip-mods`,
              finishedListener
            );
            // Suppression des archives zip des mods si besoin :
            mods.forEach((mod) => {
              const modZip = path.join(this.modsDir, mod);
              if (fs.existsSync(modZip)) {
                fs.unlinkSync(modZip);
              }
            });
            resolve(true);
          };

          ipcRenderer.on(
            `multi-unzip-progress-${ThunderstoreManager.id}-unzip-mods`,
            progressListener
          );
          ipcRenderer.once(
            `multi-unzip-finished-${ThunderstoreManager.id}-unzip-mods`,
            finishedListener
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
      ensure:
        fs.existsSync(this.BepInExPluginsDir) &&
        fs.existsSync(this.BepInExConfigDir),
      then: async () => {
        const pluginsDir = fs.readdir(this.BepInExPluginsDir);
        const configsDir = fs.readdir(this.BepInExConfigDir);

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

  async getHash() {
    return new Manager().handleError({
      ensure:
        fs.existsSync(this.BepInExPluginsDir) &&
        fs.existsSync(this.BepInExConfigDir),
      then: async () => {
        await GameManager.preserveGameFolder();
        await GameManager.clean();
        const pluginsHash = await hashFolder(this.BepInExPluginsDir);
        const configsHash = await hashFolder(this.BepInExConfigDir);
        await GameManager.restoreGameFolder();

        return {
          plugins: pluginsHash,
          config: configsHash,
        };
      },
    });
  }

  update = async (
    callback = (text, downloadedBytes, totalBytes, percent, speed) => {},
    text_dowload = "Téléchargement des mods...",
    text_unzip = "Décompression des mods..."
  ) => {
    let isOk = true;

    return await new Manager().handleError({
      ensure:
        fs.existsSync(this.manifestPath) && fs.existsSync(this.newManifestPath),
      then: async () => {
        const NewManifest = JSON.parse(
          fs.readFileSync(this.newManifestPath, "utf-8")
        );
        const ActualManifest = JSON.parse(
          fs.readFileSync(this.manifestPath, "utf-8")
        );

        const actual_mods = ActualManifest.dependencies || [];
        const new_mods = NewManifest.dependencies || [];
        const to_delete = actual_mods.filter((mod) => !new_mods.includes(mod));
        const to_add = new_mods.filter((mod) => !actual_mods.includes(mod));

        await Promise.all(
          to_delete.map((mod) => {
            const modPath = path.join(this.BepInExPluginsDir, mod);
            if (fs.existsSync(modPath)) {
              fs.rmSync(modPath, { recursive: true });
            }
            return;
          })
        );

        if (isOk) isOk = await this.dowloadMods(callback, text_dowload, to_add);
        if (isOk) isOk = await this.unzipMods(callback, text_unzip);

        if (!isOk) throw new Error("Erreur lors de l'update du modpack !");
      },
    });
  };

  async getInstalledMods() {
    return new Manager().handleError({
      ensure: fs.existsSync(this.BepInExPluginsDir),
      then: async () => {
        return fs.readdirSync(this.BepInExPluginsDir);
      },
    });
  }

  async getIsInstalled() {
    return fs.existsSync(this.manifestPath);
  }

  async uninstallModpackConfig() {
    return new Manager().handleError({
      ensure: fs.existsSync(this.BepInExConfigDir),
      then: async () => {
        fs.rmSync(this.BepInExConfigDir, { recursive: true });
      },
    });
  }

  isAdminModsInstalled(mods = this.modsAdmin || []) {
    if (!Array.isArray(mods) || mods.length === 0) return false;
    const installedMods = fs.readdirSync(this.BepInExPluginsDir);
    return mods.every((mod) => installedMods.includes(mod));
  }

  isAdminModsAvailable(mods = this.modsAdmin || []) {
    if (!Array.isArray(mods) || mods.length === 0) return false;
    return true;
  }

  unInstallAdminMods = async (mods = this.modsAdmin || []) => {
    return new Manager().handleError({
      ensure:
        fs.existsSync(this.BepInExPluginsDir) && this.isAdminModsInstalled(),
      then: async () => {
        const installedMods = fs.readdirSync(this.BepInExPluginsDir);
        // Ajout de la vérification :
        if (!Array.isArray(mods)) mods = [];
        const to_delete = mods.filter((mod) => installedMods.includes(mod));

        await Promise.all(
          to_delete.map((mod) => {
            const modPath = path.join(this.BepInExPluginsDir, mod);
            if (fs.existsSync(modPath)) {
              fs.rmSync(modPath, { recursive: true });
            }
            return;
          })
        );
      },
    });
  };

  InstallAdminMods = async (
    callback = (text, downloadedBytes, totalBytes, percent, speed) => {},
    text_dowload = "Téléchargement des mods Admin...",
    text_unzip = "Décompression des mods Admin..."
  ) => {
    let isOk = true;

    return await new Manager().handleError({
      ensure:
        fs.existsSync(this.BepInExPluginsDir) && this.modsAdmin?.length > 0,
      then: async () => {
        const mods = this.modsAdmin || [];
        await this.unInstallAdminMods();

        if (isOk) isOk = await this.dowloadMods(callback, text_dowload, mods);
        if (isOk) isOk = await this.unzipMods(callback, text_unzip);

        if (!isOk) throw new Error("Erreur lors de l'installation !");
      },
    });
  };
}

const thunderstoreManager = new ThunderstoreManager();
thunderstoreManager.init();
module.exports = thunderstoreManager;
