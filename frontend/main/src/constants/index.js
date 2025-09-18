/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const baseUrl = require("./baseUrl");
const serversInfos = require("./serversInfos");
const isDev = require("./isDev");
const pkg = require("./pkg");

module.exports = {
  baseUrl,
  serversInfos,
  isDev,
  pkg,
};
