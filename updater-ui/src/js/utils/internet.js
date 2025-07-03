const dns = require("dns");

/**
 * Vérifie la connexion Internet en tentant une résolution DNS.
 * @returns {Promise<boolean>} true si connecté, false sinon
 */
function hasInternetConnection() {
  return new Promise((resolve) => {
    dns.lookup("google.com", (err) => {
      if (err && err.code === "ENOTFOUND") {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

export default { hasInternetConnection };
