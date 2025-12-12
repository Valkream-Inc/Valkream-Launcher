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

class SevenDtoDHashManager {
  init() {
    this.modsPath = SevenDtoDDirsManager.modsPath();
    this.actualHashFilePath = SevenDtoDFilesManager.actualHashFilePath();
    this.onlineHashUrl = SevenDtoDLinksManager.gameHashUrl();
  }

  async getActualHash() {
    this.init();
    const content = await fs.readFile(this.actualHashFilePath, "utf8");
    return JSON.parse(content);
  }

  async getOnlineHash(force = false) {
    this.init();
    if (!force && this.onlineHash) return this.onlineHash;

    if (await InfosManager.getIsServerReachable()) {
      const { data } = await axios.get(this.onlineHashUrl);
      this.onlineHash = JSON.parse(data.trim());
    }

    return this.onlineHash;
  }

  async updateActualHash(content) {
    this.init();
    const json = JSON.stringify(content, null, 2);
    await fs.writeFile(this.actualHashFilePath, json, "utf8");
  }

  async getNewHash() {
    this.init();
    return await hashFolderWithArborescence(this.modsPath());
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
      this.getActualHash(),
      this.getOnlineHash(),
    ]);

    return actual === online;
  }
}

module.exports = new SevenDtoDHashManager();
