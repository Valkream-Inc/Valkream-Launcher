/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const axios = require("axios");
const fs = require("fs/promises");
const yaml = require("yaml");
const { hashFolder } = require("../utils/function/hashFolder");

const DirsManager = require("./dirsManager.js");
const FilesManager = require("./filesManager.js");
const LinksManager = require("./linksManager.js");
const InfosManager = require("./infosManager.js");

class VersionManager {
  constructor() {
    this.onlineVersionConfig = null;
    this.localVersionConfig = null;
  }

  async init() {
    this.BepInExConfigDir = DirsManager.bepInExConfigPath();
    this.BepInExPluginsDir = DirsManager.bepInExPluginsPath();

    this.gameVersionFileLink = await LinksManager.gameVersionUrl();
    this.gameVersionFilePath = FilesManager.gameVersionFilePath();
  }

  async updateOnlineVersionConfig(force = false) {
    await this.init();
    if (!force && this.onlineVersionConfig) return this.onlineVersionConfig;

    if (await InfosManager.getIsServerReachableFromInternal()) {
      const { data } = await axios.get(this.gameVersionFileLink);
      this.onlineVersionConfig = yaml.parse(data.trim());
    }
    return this.onlineVersionConfig;
  }

  async getOnlineVersionConfig() {
    await this.init();
    return this.onlineVersionConfig || this.updateOnlineVersionConfig();
  }

  async getLocalVersionConfig(force = false) {
    await this.init();
    if (!force && this.localVersionConfig) return this.localVersionConfig;

    try {
      const content = await fs.readFile(this.gameVersionFilePath, "utf8");
      this.localVersionConfig = yaml.parse(content.trim());
      return this.localVersionConfig;
    } catch {
      return null;
    }
  }

  async isVersionUpToDate() {
    await this.init();
    const [local, online] = await Promise.all([
      this.getLocalVersionConfig(),
      this.getOnlineVersionConfig(),
    ]);
    return (
      local?.version && online?.version && local.version === online.version
    );
  }

  async updateLocalVersionConfig(content) {
    await this.init();
    const dataToWrite = content || (await this.getOnlineVersionConfig());
    this.localVersionConfig = dataToWrite;
    await fs.writeFile(this.gameVersionFilePath, yaml.stringify(dataToWrite));
  }

  async getIsInstalled() {
    await this.init();
    try {
      await fs.access(this.gameVersionFilePath);
      return true;
    } catch {
      return false;
    }
  }

  async checkPluginsAndConfig() {
    await this.init();
    const {
      onlineConfigHash,
      onlinePluginsHash,
      localConfigHash,
      localPluginsHash,
    } = await this.getHash();

    if (
      onlinePluginsHash !== localPluginsHash ||
      onlineConfigHash !== localConfigHash
    ) {
      throw new Error("Plugins or configs are not up to date");
    }
  }

  async getHash() {
    await this.init();
    const GameManager = require("./gameManager.js");

    await GameManager.preserveGameFolder();
    await GameManager.clean();

    const [pluginsHash, configsHash] = await Promise.all([
      hashFolder(this.BepInExPluginsDir, "sha256", 10),
      hashFolder(this.BepInExConfigDir, "sha256", 10),
    ]);

    await GameManager.restoreGameFolder();

    const online = await this.getOnlineVersionConfig();
    return {
      localPluginsHash: pluginsHash,
      localConfigHash: configsHash,
      onlinePluginsHash: online?.modpack?.hash?.plugins,
      onlineConfigHash: online?.modpack?.hash?.config,
    };
  }
}

module.exports = new VersionManager();
