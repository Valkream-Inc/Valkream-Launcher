/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const axios = require("axios");
const fs = require("fs");
const yaml = require("yaml");

const FilesManager = require("./filesManager.js");
const LinksManager = require("./linksManager.js");
const CheckInfos = require("../ipc/handlers/check-infos.js");

class VersionManager {
  async init() {
    this.gameVersionFileLink = await LinksManager.gameVersionUrl();
    this.gameVersionFilePath = await FilesManager.gameVersionFilePath();
  }

  async updateOnlineVersionConfig() {
    if ((await CheckInfos.getInfos()).isServerReachable) {
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
}

const versionManager = new VersionManager();
versionManager.init();
module.exports = versionManager;
