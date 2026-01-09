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
      const localHash = await this.getLocalHash();
      return localHash && Object.keys(localHash).length > 0;
    } catch {
      return false;
    }
  }

  async getIsUpToDate() {
    const [local, online] = await Promise.all([
      this.getLocalHash(),
      this.getOnlineHash(),
    ]);

    const localStr = local?.toString("utf8").trim();
    const onlineStr = online?.toString("utf8").trim();

    return localStr === onlineStr;
  }
}

module.exports = new SevenDtoDHashManager();
