/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { shell } = require("electron");

class SevenDtoDSteamManager {
  async open() {
    try {
      await shell.openExternal("steam://store/251570");
    } catch (err) {
      console.error("Impossible d'ouvrir la page Steam :", err.message);
    }
  }
}

module.exports = new SevenDtoDSteamManager();
