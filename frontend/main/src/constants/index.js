/**
 * @author Valkream Team
 * @license MIT-NC
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
