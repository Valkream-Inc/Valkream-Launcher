/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { baseUrl } = require("../../constants");
const { toValidUrl } = require("../../utils");
const { platform } = require("os");

class SevenDtoDLinksManager {
  async gameVersionUrl() {
    const SettingsManager = require("../settingsManager");
    const isBeta = await SettingsManager.getSetting("betaEnabled");
    return `${baseUrl}/games/SevenDtoD/latest/latest${
      isBeta ? ".beta" : ""
    }.yml`;
  }

  async gameZipLink() {
    const SevenDtoDVersionManager = require("./SevenDtoDVersionManager");
    const config = await SevenDtoDVersionManager.getOnlineVersionConfig();
    const urls = config?.sevendtod?.download_url;

    if (!urls) throw new Error("Game download URLs not found in config");

    const url = urls[platform()];
    if (!url)
      throw new Error(`No game download URL found for platform: ${platform()}`);

    return toValidUrl(url);
  }

  async modHashLink() {
    const SevenDtoDVersionManager = require("./SevenDtoDVersionManager");
    const config = await SevenDtoDVersionManager.getOnlineVersionConfig();
    const url = config?.modpack?.hashs_url;

    if (!url) throw new Error("Mod Hash Url URL not found in config");

    return toValidUrl(url);
  }

  async modBaseLink() {
    const SevenDtoDVersionManager = require("./SevenDtoDVersionManager");
    const config = await SevenDtoDVersionManager.getOnlineVersionConfig();
    const url = config?.modpack?.download_url;

    if (!url) throw new Error("Mod Hash Url URL not found in config");

    return toValidUrl(url);
  }
}

module.exports = new SevenDtoDLinksManager();
