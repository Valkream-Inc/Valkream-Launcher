/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { baseUrl } = require("../constants");
const VersionManager = require("./versionManager");
const SettingsManager = require("./settingsManager");
const { toValidUrl } = require("../utils");

class LinksManager {
  maintenanceUrl = () => `${baseUrl}/config/maintenance.json`;

  eventUrl = () => `${baseUrl}/config/event.json`;

  gameVersionUrl = async () => {
    const isBeta = await SettingsManager.getSetting("betaEnabled");
    return `${baseUrl}/game/latest/latest${isBeta ? ".beta" : ""}.yml`;
  };

  gameZipLink = async () =>
    toValidUrl(
      (await VersionManager.getOnlineVersionConfig()).valheim.dowload_url[
        platform()
      ]
    );

  bepInExZipLink = async () =>
    toValidUrl(
      (await VersionManager.getOnlineVersionConfig()).bepinex.dowload_url[
        platform()
      ]
    );

  modpackZipLink = async () =>
    toValidUrl(
      (await VersionManager.getOnlineVersionConfig()).modpack.dowload_url
    );
}

const linksManager = new LinksManager();
module.exports = linksManager;
