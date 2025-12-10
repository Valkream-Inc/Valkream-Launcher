/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { shell } = require("electron");

class SevenDtoDSteamManager {
  async start() {
    try {
      await shell.openExternal("steam://rungameid/251570");
    } catch (err) {
      console.error("Impossible de lancer le jeu via Steam :", err.message);
    }
  }
}

module.exports = new SevenDtoDSteamManager();
