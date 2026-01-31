/**
 * @author Valkream Team
 * @license MIT-NC
 */

const axios = require("axios");
const fs = require("fs/promises");
const yaml = require("yaml");
const { hashFolder } = require("../../utils/function/hashFolder");

const ValheimFilesManager = require("./ValheimFilesManager.js");
const ValheimLinksManager = require("./ValheimLinksManager.js");
const InfosManager = require("../infosManager.js");
const noCache = require("../../constants/noCaheHeader.js");

class SevenDtoDVersionManager {
  constructor() {
    this.onlineVersionConfig = null;
    this.localVersionConfig = null;
  }

  async init() {
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

  async isUpToDate() {
    await this.init();
    const [local, online] = await Promise.all([
      this.getLocalVersionConfig(),
      this.getOnlineVersionConfig(),
    ]);
    return (
      local?.version && online?.version && local.version === online.version
    );
  }

  async isMajorUpdate() {
    const [local, online] = await Promise.all([
      this.getLocalVersionConfig(),
      this.getOnlineVersionConfig(),
    ]);

    const majorLocal = parseInt((local?.version ?? "0.0.0").split(".")[0], 10);
    const majorOnline = parseInt(
      (online?.version ?? "0.0.0").split(".")[0],
      10,
    );
    isMajorUpdate = majorLocal !== majorOnline;
  }

  async getLocalVersion() {
    const [local] = await Promise.all([this.getLocalVersionConfig()]);
    return this.getIsInstalled() ? local?.version : "0.0.0";
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
}

module.exports = new SevenDtoDVersionManager();
