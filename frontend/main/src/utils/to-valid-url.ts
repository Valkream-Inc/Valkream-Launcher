/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { baseUrl } = require("../constants");

const toValidUrl = (url) => {
  if (typeof url !== "string") throw new Error("URL must be a string");
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  } else {
    // S'assurer qu'il n'y a pas de double slash
    return baseUrl.replace(/\/$/, "") + "/" + url.replace(/^\//, "");
  }
};

module.exports = toValidUrl;
