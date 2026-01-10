/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { baseUrl } = require("../../constants");
const { toValidUrl } = require("../../utils");
const { platform } = require("os");

class ValheimLinksManager {
  async gameVersionUrl() {
    const SettingsManager = require("../settingsManager");
    const isBeta = await SettingsManager.getSetting("betaEnabled");
    return `${baseUrl}/game/Valheim/latest/latest${isBeta ? ".beta" : ""}.yml`;
  }

  async gameZipLink() {
    const ValheimVersionManager = require("./ValheimVersionManager");
    const config = await ValheimVersionManager.getOnlineVersionConfig();
    const urls = config?.valheim?.download_url;

    if (!urls) throw new Error("Game download URLs not found in config");

    const url = urls[platform()];
    if (!url)
      throw new Error(`No game download URL found for platform: ${platform()}`);

    return toValidUrl(url);
  }

  async bepInExZipLink() {
    const ValheimVersionManager = require("./ValheimVersionManager");
    const config = await ValheimVersionManager.getOnlineVersionConfig();
    const urls = config?.bepinex?.download_url;

    if (!urls) throw new Error("BepInEx download URLs not found in config");

    const url = urls[platform()];
    if (!url)
      throw new Error(
        `No BepInEx download URL found for platform: ${platform()}`
      );

    return toValidUrl(url);
  }

  async modpackZipLink() {
    const ValheimVersionManager = require("./ValheimVersionManager");
    const config = await ValheimVersionManager.getOnlineVersionConfig();
    const url = config?.modpack?.download_url;

    if (!url) throw new Error("Modpack download URL not found in config");

    return toValidUrl(url);
  }
}

module.exports = new ValheimLinksManager();
