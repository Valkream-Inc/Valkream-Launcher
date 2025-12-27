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
  constructor() {
    this.localHash = null;
    this.onlineHash = null;
  }

  init() {
    this.modsPath = SevenDtoDDirsManager.modsPath();
  }

  async getLocalHash(force = false, callback = () => {}) {
    this.init();
    if (!force && this.localHash !== null) return this.localHash;
    this.localHash =
      (await hashFolderWithArborescence(this.modsPath, callback)) || {};
    return this.localHash;
  }

  async getOnlineHash(force = false) {
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

  async getIsInstalled() {
    try {
      if ((await this.getLocalHash()).length === 0) return false;
      return true;
    } catch {
      return false;
    }
  }

  async getIsUpToDate() {
    const [local, online] = await Promise.all([
      this.getLocalHash(),
      this.getOnlineHash(),
    ]);

    return local === online;
  }
}

module.exports = new SevenDtoDHashManager();
