const dns = require("dns");
const { baseUrl } = require("../constants/constants");

/**
 * Vérifie la connexion Internet en tentant une résolution DNS.
 * @returns {Promise<boolean>} true si connecté, false sinon
 */
function hasInternetConnection(url = baseUrl) {
  return new Promise((resolve) => {
    dns.lookup(url, (err) => {
      if (err && err.code === "ENOTFOUND") {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

module.exports = { hasInternetConnection };
