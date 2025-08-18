/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const dns = require("dns");
const { baseUrl } = require("../constants/constants");
const axios = require("axios");

/**
 * Vérifie la connexion Internet en tentant une résolution DNS.
 * @returns {Promise<boolean>} true si connecté, false sinon
 */
function hasInternetConnection(hostname = "google.com") {
  return new Promise((resolve) => {
    dns.lookup(hostname, (err) => {
      if (err && err.code === "ENOTFOUND") {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Vérifie la connexion à un serveur via son URL avec une requête HTTP GET.
 * @param {string} url - L'URL du serveur à tester (ex: 'http://localhost:3000')
 * @returns {Promise<boolean>} true si le serveur répond, false sinon
 */
async function isServerReachable(url = baseUrl) {
  try {
    await axios.get(url, { timeout: 3000 });
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = { hasInternetConnection, isServerReachable };
