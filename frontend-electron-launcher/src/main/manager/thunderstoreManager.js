/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const { hashFolder } = require("valkream-function-lib");

const GameManager = require("./gameManager.js");
const DirsManager = require("./dirsManager.js");
const FilesManager = require("./filesManager.js");
const LinksManager = require("./linksManager.js");
const checkInfos = require("../ipc/handlers/check-infos.js");

class ThunderstoreManager {
  async init() {
    this.gameDir = await DirsManager.gamePath();

    this.BepInExDir = await DirsManager.bepInExPath();
    this.BepInExConfigDir = await DirsManager.bepInExConfigPath();
    this.BepInExPluginsDir = await DirsManager.bepInExPluginsPath();

    this.ModPackDir = await DirsManager.dowloadModPackPath();
    this.modsDir = await DirsManager.dowloadModsPath();

    this.extractManifestPath = await FilesManager.extractManifestPath();
    this.installedManifestPath = await FilesManager.installedManifestPath();

    if ((await checkInfos.getInfos()).isServerReachable) {
      this.modpackZipLink = await LinksManager.modpackZipLink();
      this.modpackZipPath = await FilesManager.modpackZipPath();
    }
  }

  async downloadModpack(
    callback = (text, downloadedBytes, totalBytes, percent, speed) => {},
    text = "Téléchargement du modpack..."
  ) {
    return await dowloadMultiplefiles(
      [
        {
          url: this.modpackZipLink,
          destPath: this.modpackZipPath,
        },
      ],
      (data) =>
        callback(
          text,
          data.downloadedBytes,
          data.totalBytes,
          data.percent,
          data.speed
        )
    );
  }

  async unzipModpack(
    callback = (text, decompressedBytes, totalBytes, percent, speed) => {},
    text = "Décompression du modpack..."
  ) {
    return await unZipMultipleFiles(
      [{ path: this.modpackZipPath, destPath: this.ModPackDir }],
      (data) =>
        callback(
          text,
          data.decompressedBytes,
          data.totalBytes,
          data.percent,
          data.speed
        )
    );
  }

  async dowloadMods(
    callback = (text, downloadedBytes, totalBytes, percent, speed) => {},
    text = "Téléchargement des mods...",
    customMods = null
  ) {
    let manifest;
    if (fs.existsSync(this.extractManifestPath))
      manifest = JSON.parse(fs.readFileSync(this.extractManifestPath, "utf-8"));

    const mods = customMods || manifest.dependencies || [];

    if (fs.existsSync(this.modsDir))
      fs.rmSync(this.modsDir, { recursive: true });
    fs.mkdirSync(this.modsDir, { recursive: true });

    await dowloadMultiplefiles(
      mods.map((mod) => ({
        url: this.getModInfos(mod).url,
        destPath: path.join(this.modsDir, mod + ".zip"),
      })),
      (data) =>
        callback(
          text,
          data.downloadedBytes,
          data.totalBytes,
          data.percent,
          data.speed
        )
    );

    return fse.moveSync(this.extractManifestPath, this.installedManifestPath, {
      overwrite: true,
      force: true,
    });
  }

  async unzipMods(
    callback = (text, decompressedBytes, totalBytes, percent, speed) => {},
    text = "Décompression des mods..."
  ) {
    const mods = fs.readdirSync(this.modsDir);
    return await unZipMultipleFiles(
      mods.map((mod) => ({
        path: path.join(this.modsDir, mod),
        destPath: path.join(this.BepInExPluginsDir, mod.replace(".zip", "")),
      })),
      (data) =>
        callback(
          text,
          data.decompressedBytes,
          data.totalBytes,
          data.percent,
          data.speed
        )
    );
  }

  getModInfos(modName) {
    if (!modName) throw new Error("Mod name is undefined");
    const [author, name, version] = modName.split("-");
    return {
      url: `https://thunderstore.io/package/download/${author}/${name}/${version}/`,
      author,
      name,
      version,
    };
  }

  async ckeckPluginsAndConfig() {
    const { plugins, config } = await this.getHash();

    if (
      plugins !== this.getOnlineVersionConfig().hash.plugins ||
      config !== this.getOnlineVersionConfig().hash.config
    )
      throw new Error("Plugins or configs are not up to date");

    return;
  }

  async getHash() {
    await GameManager.preserveGameFolder();
    await GameManager.clean();
    const pluginsHash = await hashFolder(this.BepInExPluginsDir, "sha256", 10);
    const configsHash = await hashFolder(this.BepInExConfigDir, "sha256", 10);
    await GameManager.restoreGameFolder();

    return {
      plugins: pluginsHash,
      config: configsHash,
    };
  }

  update = async (
    callback = (text, downloadedBytes, totalBytes, percent, speed) => {},
    text_dowload = "Téléchargement des mods...",
    text_unzip = "Décompression des mods..."
  ) => {
    const NewManifest = JSON.parse(
      fs.readFileSync(this.extractManifestPath, "utf-8")
    );

    const actual_mods = (await this.getInstalledMods()).filter(
      (mod) => !mod.endsWith(".dll")
    );
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

    await this.dowloadMods(callback, text_dowload, to_add);
    await this.unzipMods(callback, text_unzip);
  };

  async getInstalledMods() {
    return fs.readdirSync(this.BepInExPluginsDir);
  }

  async getIsInstalled() {
    return fs.existsSync(this.installedManifestPath);
  }

  async uninstallModpackConfig() {
    fs.rmSync(this.BepInExConfigDir, { recursive: true });
  }

  isCustomModsInstalled(mods = []) {
    if (!Array.isArray(mods) || mods.length === 0) return false;
    const installedMods = fs.readdirSync(this.BepInExPluginsDir);
    return mods.every((mod) => installedMods.includes(mod));
  }

  isCustomModsAvailable(mods = []) {
    if (!Array.isArray(mods) || mods.length === 0) return false;
    return true;
  }

  unInstallCustomMods = async (mods = []) => {
    if (!this.isCustomModsInstalled(mods))
      throw new Error("Mods are not installed");

    const installedMods = fs.readdirSync(this.BepInExPluginsDir);
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
  };

  InstallCustomMods = async (
    mods = [],
    callback = (text, downloadedBytes, totalBytes, percent, speed) => {},
    text_dowload = "Téléchargement des mods Custom...",
    text_unzip = "Décompression des mods Custom..."
  ) => {
    await this.unInstallCustomMods(mods);
    await this.dowloadMods(callback, text_dowload, mods);
    await this.unzipMods(callback, text_unzip);
  };
}

const thunderstoreManager = new ThunderstoreManager();
thunderstoreManager.init();
module.exports = thunderstoreManager;
