/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { baseUrl } = require("../../constants");

class SevenDtoDLinksManager {
  async gameHashUrl() {
    const SettingsManager = require("../settingsManager");
    const isBeta = await SettingsManager.getSetting("betaEnabled");
    return `${baseUrl}/game/SevenDtoD/latest/mods${isBeta ? ".beta" : ""}.json`;
  }

  async modsFileBaseUrl() {
    const SettingsManager = require("../settingsManager");
    const isBeta = await SettingsManager.getSetting("betaEnabled");
    return `${baseUrl}/game/SevenDtoD/latest/${
      isBeta ? "beta-files" : "files"
    }`;
  }
}

module.exports = new SevenDtoDLinksManager();
