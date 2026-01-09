/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { shell } = require("electron");
const fs = require("fs/promises");
const path = require("path");

const SevenDtoDFilesManager = require("./SevenDtoDFilesManager.js");

class SevenDtoDSteamManager {
  async play() {
    try {
      await shell.openExternal("steam://rungameid/251570");
    } catch (err) {
      console.error("Impossible de lancer le jeu via Steam :", err.message);
    }
  }

  async getIsAValidSteamGamePath() {
    try {
      await fs.access(await SevenDtoDFilesManager.gameExePath());
      return true;
    } catch (err) {
      console.error("Impossible d'accéder au chemin du jeu :", err.message);
      return false;
    }
  }

  async testSteamGamePath(path_to_test) {
    try {
      await fs.access(
        path.join(path_to_test, SevenDtoDFilesManager.gameExeName)
      );
      return true;
    } catch (err) {
      console.error("Impossible de tester le chemin du jeu :", err.message);
      return false;
    }
  }
}

module.exports = new SevenDtoDSteamManager();
