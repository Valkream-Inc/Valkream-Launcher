/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { baseUrl } = require("../constants");
const { toValidUrl } = require("../utils");
const { platform } = require("os");

class LinksManager {
  maintenanceUrl = (game) => `${baseUrl}/config/${game}/maintenance.json`;

  eventUrl = (game) => `${baseUrl}/config/${game}/event.json`;

  async gameVersionUrl() {
    const SettingsManager = require("./settingsManager");
    const isBeta = await SettingsManager.getSetting("betaEnabled");
    return `${baseUrl}/game/Valheim/latest/latest${isBeta ? ".beta" : ""}.yml`;
  }

  async gameZipLink() {
    const VersionManager = require("./versionManager");
    const config = await VersionManager.getOnlineVersionConfig();
    const urls = config?.valheim?.download_url;

    if (!urls) throw new Error("Game download URLs not found in config");

    const url = urls[platform()];
    if (!url)
      throw new Error(`No game download URL found for platform: ${platform()}`);

    return toValidUrl(url);
  }

  async bepInExZipLink() {
    const VersionManager = require("./versionManager");
    const config = await VersionManager.getOnlineVersionConfig();
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
    const VersionManager = require("./versionManager");
    const config = await VersionManager.getOnlineVersionConfig();
    const url = config?.modpack?.download_url;

    if (!url) throw new Error("Modpack download URL not found in config");

    return toValidUrl(url);
  }
}

const linksManager = new LinksManager();
module.exports = linksManager;
