/**
 * @author Valkream Team
 * @license MIT-NC
 */

const fs = require("fs/promises");
const { shell } = require("electron");
const SevenDtoDDirsManager = require("./SevenDtoDDirsManager.js");

class SevenDtoDGameManager {
  init() {
    this.gameRootDir = SevenDtoDDirsManager.gameRootPath();
    this.gameDir = SevenDtoDDirsManager.gamePath();
  }

  async openFolder() {
    this.init();
    try {
      await fs.access(this.gameDir);
      return shell.openPath(this.gameDir);
    } catch {
      throw new Error("Le dossier du jeu n'existe pas !");
    }
  }
  async uninstall() {
    this.init();
    try {
      await fs.rm(this.gameRootDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 200,
      });

      await fs.mkdir(this.gameRootDir, { recursive: true });
    } catch (err) {
      throw new Error(`Échec de la désinstallation : ${err.message}`);
    }
  }
}

module.exports = new SevenDtoDGameManager();
