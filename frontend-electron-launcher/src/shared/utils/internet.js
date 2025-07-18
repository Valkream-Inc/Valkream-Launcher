const dns = require("dns");
const { baseUrl } = require("../constants/constants");

/**
 * Vérifie la connexion Internet en tentant une résolution DNS.
 * @returns {Promise<boolean>} true si connecté, false sinon
 */

// Enlève le protocole (http:// ou https://) et tout chemin après le domaine
const baseUrlHostname = baseUrl.replace(/^https?:\/\//i, "").split("/")[0];

function hasInternetConnection(url = baseUrlHostname) {
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
