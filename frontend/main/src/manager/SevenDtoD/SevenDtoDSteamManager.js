/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { shell } = require("electron");
const fs = require("fs/promises");

const SevenDtoDFilesManager = require("./SevenDtoDFilesManager.js");

class SevenDtoDSteamManager {
  async start() {
    try {
      await shell.openExternal("steam://rungameid/251570");
    } catch (err) {
      console.error("Impossible de lancer le jeu via Steam :", err.message);
    }
  }

  async isAValidSteamGamePath() {
    try {
      await fs.access(SevenDtoDFilesManager.gameExePath());
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new SevenDtoDSteamManager();
