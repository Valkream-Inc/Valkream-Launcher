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

    // Fonction de comparaison profonde des objets
    function deepEqual(obj1, obj2) {
      const k1 = Object.keys(obj1).sort();
      const k2 = Object.keys(obj2).sort();
      if (k1.length !== k2.length) return false;
      for (let i = 0; i < k1.length; i++) {
        if (k1[i] !== k2[i]) return false;

        const val1 = obj1[k1[i]];
        const val2 = obj2[k2[i]];

        if (typeof val1 === "object" && val1 !== null) {
          if (!deepEqual(val1, val2)) return false;
        } else if (val1 !== val2) {
          return false;
        }
      }
      return true;
    }

    return deepEqual(local, online);
  }
}

module.exports = new SevenDtoDHashManager();
