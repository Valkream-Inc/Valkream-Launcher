/**
 * @author Valkream Team
 * @license MIT-NC
 */

const isDev = require("./isDev");

const baseUrl = isDev
  ? "http://localhost:3000"
  : "https://play.valkream.com";

module.exports = baseUrl;
