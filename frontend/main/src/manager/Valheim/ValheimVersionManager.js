/**
 * @author Valkream Team
 * @license MIT-NC
 */

const axios = require("axios");
const fs = require("fs/promises");
const yaml = require("yaml");
const { hashFolder } = require("../../utils/function/hashFolder");

const ValheimDirsManager = require("./ValheimDirsManager.js");
const ValheimFilesManager = require("./ValheimFilesManager.js");
const ValheimLinksManager = require("./ValheimLinksManager.js");
const InfosManager = require("../infosManager.js");
const noCache = require("../../constants/noCaheHeader.js");

class ValheimVersionManager {
  constructor() {
    this.onlineVersionConfig = null;
    this.localVersionConfig = null;
  }

  async init() {
    this.BepInExConfigDir = ValheimDirsManager.bepInExConfigPath();
    this.BepInExPluginsDir = ValheimDirsManager.bepInExPluginsPath();

    this.gameVersionFileLink = await ValheimLinksManager.gameVersionUrl();
    this.gameVersionFilePath = ValheimFilesManager.gameVersionFilePath();
  }

  async getOnlineVersionConfig(force = false) {
    await this.init();
    if (!force && this.onlineVersionConfig) return this.onlineVersionConfig;

    if (await InfosManager.getIsServerReachable()) {
      const { data } = await axios.get(this.gameVersionFileLink, noCache);
      this.onlineVersionConfig = yaml.parse(data.trim());
    }

    return this.onlineVersionConfig;
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
    const ValheimGameManager = require("./ValheimGameManager.js");

    await ValheimGameManager.preserveGameFolder();
    await ValheimGameManager.clean();

    const [pluginsHash, configsHash] = await Promise.all([
      hashFolder(this.BepInExPluginsDir, "sha256", 10),
      hashFolder(this.BepInExConfigDir, "sha256", 10),
    ]);

    await ValheimGameManager.restoreGameFolder();

    const online = await this.getOnlineVersionConfig();
    return {
      localPluginsHash: pluginsHash,
      localConfigHash: configsHash,
      onlinePluginsHash: online?.modpack?.hash?.plugins,
      onlineConfigHash: online?.modpack?.hash?.config,
    };
  }
}

module.exports = new ValheimVersionManager();
