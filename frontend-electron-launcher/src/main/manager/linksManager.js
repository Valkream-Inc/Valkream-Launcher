/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { baseUrl } = require("../constants");
const { toValidUrl } = require("../utils");

class LinksManager {
  maintenanceUrl = () => `${baseUrl}/config/maintenance.json`;

  eventUrl = () => `${baseUrl}/config/event.json`;

  gameVersionUrl = async () => {
    const SettingsManager = require("./settingsManager");
    const isBeta = await SettingsManager.getSetting("betaEnabled");
    return `${baseUrl}/game/latest/latest${isBeta ? ".beta" : ""}.yml`;
  };

  gameZipLink = async () => {
    const VersionManager = require("./versionManager");
    return toValidUrl(
      (await VersionManager.getOnlineVersionConfig()).valheim.dowload_url[
        platform()
      ]
    );
  };

  bepInExZipLink = async () => {
    const VersionManager = require("./versionManager");
    return toValidUrl(
      (await VersionManager.getOnlineVersionConfig()).bepinex.dowload_url[
        platform()
      ]
    );
  };

  modpackZipLink = async () => {
    const VersionManager = require("./versionManager");
    return toValidUrl(
      (await VersionManager.getOnlineVersionConfig()).modpack.dowload_url
    );
  };
}

const linksManager = new LinksManager();
module.exports = linksManager;
