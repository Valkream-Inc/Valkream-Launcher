/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const baseUrl = require("./baseUrl");
const serverInfos = require("./serverInfos");
const isSteamInstallation = require("./steamInstallation");
const refreshTimeout = require("./refreshTimeout");
const isDev = require("./isDev");
const pkg = require("./pkg");

module.exports = {
  baseUrl,
  serverInfos,
  isSteamInstallation,
  refreshTimeout,
  isDev,
  pkg,
};
