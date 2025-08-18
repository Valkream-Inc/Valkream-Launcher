/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const baseUrl = require("./baseUrl");
const serverInfos = require("./serverInfos");
const isSteamInstallation = require("./steamInstallation");
const refreshTimeout = require("./refreshTimeout");

module.exports = {
  baseUrl,
  serverInfos,
  isSteamInstallation,
  refreshTimeout,
};
