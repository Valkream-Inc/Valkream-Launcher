/**
 * @author Valkream Team
 * @license MIT-NC
 */

const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");

const ValheimDirsManager = require("./ValheimDirsManager.js");
const ValheimFilesManager = require("./ValheimFilesManager.js");
const ValheimLinksManager = require("./ValheimLinksManager.js");
const InfosManager = require("../infosManager.js");

const {
  dowloadMultiplefiles,
  unZipMultipleFiles,
} = require("../../utils/index.js");

class ValheimThunderstoreManager {
  async init() {
    this.gameDir = ValheimDirsManager.gamePath();

    this.BepInExDir = ValheimDirsManager.bepInExPath();
    this.BepInExConfigDir = ValheimDirsManager.bepInExConfigPath();
    this.BepInExPluginsDir = ValheimDirsManager.bepInExPluginsPath();

    this.ModPackDir = ValheimDirsManager.downloadModPackPath();
    this.modsDir = ValheimDirsManager.downloadModsPath();

    this.extractManifestPath = ValheimFilesManager.extractManifestPath();
    this.installedManifestPath = ValheimFilesManager.installedManifestPath();

    if (await InfosManager.getIsServerReachableFromInternal()) {
      this.modpackZipLink = await ValheimLinksManager.modpackZipLink();
      this.modpackZipPath = ValheimFilesManager.modpackZipPath();
    }
  }

  async downloadModpack(
    callback = () => {},
    text = "Téléchargement du modpack..."
  ) {
    await this.init();
    if (!this.modpackZipLink) throw new Error("Lien du modpack introuvable");
    return dowloadMultiplefiles(
      [{ url: this.modpackZipLink, destPath: this.modpackZipPath }],
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
    callback = () => {},
    text = "Décompression du modpack..."
  ) {
    await this.init();
    if (!fs.existsSync(this.modpackZipPath))
      throw new Error("Archive modpack introuvable !");

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

  async finishModpack() {
    await this.init();
    await fse
      .move(path.join(this.ModPackDir, "config"), this.BepInExConfigDir, {
        overwrite: true,
      })
      .catch(() => {});
    await fse.remove(this.modpackZipPath);
    return;
  }

  async dowloadMods(
    callback = () => {},
    text = "Téléchargement des mods...",
    customMods = null
  ) {
    await this.init();
    let manifest = {};
    if (fs.existsSync(this.extractManifestPath)) {
      try {
        manifest = JSON.parse(
          fs.readFileSync(this.extractManifestPath, "utf-8")
        );
      } catch (err) {
        throw new Error("Manifest invalide ou corrompu");
      }
    }

    const mods = customMods || manifest.dependencies || [];
    if (!Array.isArray(mods) || mods.length === 0) return;

    fse.emptyDirSync(this.modsDir);

    await dowloadMultiplefiles(
      mods.map((mod) => {
        const infos = this.getModInfos(mod);
        return {
          url: infos.url,
          destPath: path.join(this.modsDir, mod + ".zip"),
        };
      }),
      (data) =>
        callback(
          text,
          data.downloadedBytes,
          data.totalBytes,
          data.percent,
          data.speed
        )
    );

    if (fs.existsSync(this.extractManifestPath)) {
      fse.copy(this.extractManifestPath, this.installedManifestPath, {
        overwrite: true,
      });
    }
  }

  async unzipMods(callback = () => {}, text = "Décompression des mods...") {
    await this.init();
    if (!fs.existsSync(this.modsDir)) return;

    const mods = fs.readdirSync(this.modsDir).filter((m) => m.endsWith(".zip"));
    if (mods.length === 0) return;

    return unZipMultipleFiles(
      mods.map((mod) => ({
        path: path.join(this.modsDir, mod),
        destPath: path.join(this.BepInExPluginsDir, mod.split(".zip")[0]),
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

  async finishMods() {
    await this.init();
    await fse.remove(this.modsDir);
    await fse.ensureDir(this.modsDir);
    return;
  }

  getModInfos(modName) {
    if (!modName) throw new Error("Mod name is undefined");
    const parts = modName.split("-");
    if (parts.length < 3) throw new Error(`Nom du mod invalide: ${modName}`);
    const [author, name, version] = parts;
    return {
      url: `https://thunderstore.io/package/download/${author}/${name}/${version}/`,
      author,
      name,
      version,
    };
  }

  async update(
    callback = () => {},
    text_download = "Téléchargement des mods...",
    text_unzip = "Décompression des mods..."
  ) {
    await this.init();
    if (!fs.existsSync(this.extractManifestPath))
      throw new Error("Manifest inexistant");

    const NewManifest = JSON.parse(
      fs.readFileSync(this.extractManifestPath, "utf-8")
    );
    const actual_mods = (await this.getInstalledMods()).filter(
      (mod) => !mod.endsWith(".dll")
    );
    const new_mods = NewManifest.dependencies || [];

    const to_delete = actual_mods.filter((mod) => !new_mods.includes(mod));
    const to_add = new_mods.filter((mod) => !actual_mods.includes(mod));

    // suppression
    for (const mod of to_delete) {
      const modPath = path.join(this.BepInExPluginsDir, mod);
      fse.removeSync(modPath);
    }

    if (to_add.length > 0) {
      await this.dowloadMods(callback, text_download, to_add);
      await this.unzipMods(callback, text_unzip);
    }
  }

  async getInstalledMods() {
    await this.init();
    if (!fs.existsSync(this.BepInExPluginsDir)) return [];
    return fs.readdirSync(this.BepInExPluginsDir);
  }

  async getIsInstalled() {
    await this.init();
    return fs.existsSync(this.installedManifestPath);
  }

  async uninstallModpackConfig() {
    await this.init();
    fse.remove(this.BepInExConfigDir);
    fse.remove(this.ModPackDir);
    fse.ensureDir(this.BepInExConfigDir);
    fse.ensureDir(this.ModPackDir);
  }

  async isCustomModsInstalled(mods = []) {
    await this.init();
    if (!Array.isArray(mods) || mods.length === 0) return false;
    const installedMods = await this.getInstalledMods();
    return mods.every((mod) => installedMods.includes(mod));
  }

  isCustomModsAvailable(mods = []) {
    return Array.isArray(mods) && mods.length > 0;
  }

  async unInstallCustomMods(mods = []) {
    await this.init();
    const installedMods = await this.getInstalledMods();
    const to_delete = mods.filter((mod) => installedMods.includes(mod));
    for (const mod of to_delete) {
      const modPath = path.join(this.BepInExPluginsDir, mod);
      fse.removeSync(modPath);
    }
  }

  async InstallCustomMods(
    mods = [],
    callback = () => {},
    text_download = "Téléchargement des mods Custom...",
    text_unzip = "Décompression des mods Custom..."
  ) {
    await this.init();
    if (!this.isCustomModsAvailable(mods)) return;
    await this.unInstallCustomMods(mods);
    await this.dowloadMods(callback, text_download, mods);
    await this.unzipMods(callback, text_unzip);
    await this.finishMods();
  }
}

module.exports = new ValheimThunderstoreManager();
