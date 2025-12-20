/**
 * @author Valkream Team
 * @license MIT-NC
 */

const fs = require("fs/promises");
const axios = require("axios");
const {
  hashFolderWithArborescence,
} = require("../../utils/function/hashFolderWithArborescence.js");

const InfosManager = require("../infosManager.js");
const SevenDtoDDirsManager = require("./SevenDtoDDirsManager.js");
const SevenDtoDFilesManager = require("./SevenDtoDFilesManager.js");
const SevenDtoDLinksManager = require("./SevenDtoDLinksManager.js");
const noCache = require("../../constants/noCaheHeader.js");

class SevenDtoDHashManager {
  init() {
    this.localHash = null;
    this.onlineHash = null;

    this.modsPath = SevenDtoDDirsManager.modsPath();
    this.actualHashFilePath = SevenDtoDFilesManager.actualHashFilePath();
  }

  async getInstalledHash() {
    this.init();
    const content = await fs.readFile(this.actualHashFilePath, "utf8");
    return JSON.parse(content) || {};
  }

  async getNewHash(force = false) {
    this.init();
    if (!force && this.localHash !== null) return this.localHash;
    return (await hashFolderWithArborescence(this.modsPath)) || {};
  }

  async getOnlineHash(force = false) {
    this.init();
    if (!force && this.onlineHash !== null) return this.onlineHash;
    if (await InfosManager.getIsServerReachable()) {
      const { data } = await axios.get(
        await SevenDtoDLinksManager.gameHashUrl(),
        noCache
      );
      this.onlineHash = data;
    }

    return this.onlineHash || {};
  }

  async updateActualHash(content) {
    this.init();
    const json = JSON.stringify(content, null, 2);
    await fs.writeFile(this.actualHashFilePath, json, "utf8");
  }

  async getIsInstalled() {
    this.init();
    try {
      await fs.access(this.actualHashFilePath);
      return true;
    } catch {
      return false;
    }
  }

  async isUpToDate() {
    this.init();
    const [actual, online] = await Promise.all([
      this.getInstalledHash(),
      this.getOnlineHash(),
    ]);

    return actual === online;
  }
}

module.exports = new SevenDtoDHashManager();
