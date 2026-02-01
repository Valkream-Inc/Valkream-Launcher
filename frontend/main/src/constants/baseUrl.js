/**
 * @author Valkream Team
 * @license MIT-NC
 */

const isDev = require("./isDev");

const baseUrl = isDev
  ? "https://play.valkream.com"
  : "https://play.valkream.com";

module.exports = baseUrl;
