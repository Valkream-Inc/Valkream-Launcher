/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { shell } = require("electron");

class SteamManager {
  async start() {
    try {
      await shell.openExternal("steam://rungameid/892970");
    } catch (err) {
      console.error("Impossible de lancer la mise à jour Steam :", err.message);
    }
  }

  async open() {
    try {
      await shell.openExternal("steam://store/892970");
    } catch (err) {
      console.error("Impossible d'ouvrir la page Steam :", err.message);
    }
  }
}

module.exports = new SteamManager();
