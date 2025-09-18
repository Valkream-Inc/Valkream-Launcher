/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const axios = require("axios");
const fs = require("fs");
const yaml = require("yaml");
const { hashFolder } = require("valkream-function-lib");

const DirsManager = require("./dirsManager.js");
const FilesManager = require("./filesManager.js");
const LinksManager = require("./linksManager.js");
const InfosManager = require("./infosManager.js");

class VersionManager {
  async init() {
    this.BepInExConfigDir = DirsManager.bepInExConfigPath();
    this.BepInExPluginsDir = DirsManager.bepInExPluginsPath();

    this.gameVersionFileLink = await LinksManager.gameVersionUrl();
    this.gameVersionFilePath = FilesManager.gameVersionFilePath();
  }

  async updateOnlineVersionConfig() {
    if (await InfosManager.getIsServerReachableFromInternal()) {
      const yamlContent = (
        await axios.get(this.gameVersionFileLink)
      ).data.trim();

      const parsed = yaml.parse(yamlContent);
      this.onlineVersionConfig = parsed;
    }
  }

  async getOnlineVersionConfig() {
    if (!this.onlineVersionConfig) await this.updateOnlineVersionConfig();
    return this.onlineVersionConfig;
  }

  async getLocalVersionConfig() {
    if (!fs.existsSync(this.gameVersionFilePath)) return null;

    const yamlContent = fs
      .readFileSync(this.gameVersionFilePath, "utf8")
      .trim();

    const parsed = yaml.parse(yamlContent);
    return parsed;
  }

  async isVersionUpToDate() {
    const localVersionConfig = await this.getLocalVersionConfig();
    const onlineVersionConfig = await this.getOnlineVersionConfig();
    return localVersionConfig.version === onlineVersionConfig.version;
  }

  async updateLocalVersionConfig(content) {
    const dataToWrite = content || (await this.getOnlineVersionConfig());
    fs.writeFileSync(this.gameVersionFilePath, yaml.stringify(dataToWrite));
  }

  getIsInstalled() {
    return fs.existsSync(this.gameVersionFilePath);
  }

  async ckeckPluginsAndConfig() {
    const {
      onlineConfigHash,
      onlinePluginsHash,
      localConfigHash,
      localPluginsHash,
    } = await this.getHash();

    if (
      onlinePluginsHash !== localPluginsHash ||
      onlineConfigHash !== localConfigHash
    )
      throw new Error("Plugins or configs are not up to date");

    return;
  }

  async getHash() {
    const GameManager = require("./gameManager.js");

    await GameManager.preserveGameFolder();
    await GameManager.clean();
    const pluginsHash = await hashFolder(this.BepInExPluginsDir, "sha256", 10);
    const configsHash = await hashFolder(this.BepInExConfigDir, "sha256", 10);
    await GameManager.restoreGameFolder();

    const onlinePluginsHash = (await this.getOnlineVersionConfig())?.modpack
      ?.hash?.plugins;
    const onlineConfigHash = (await this.getOnlineVersionConfig())?.modpack
      ?.hash?.config;

    return {
      localPluginsHash: pluginsHash,
      localConfigHash: configsHash,
      onlinePluginsHash: onlinePluginsHash,
      onlineConfigHash: onlineConfigHash,
    };
  }
}

const versionManager = new VersionManager();
versionManager.init();
module.exports = versionManager;
