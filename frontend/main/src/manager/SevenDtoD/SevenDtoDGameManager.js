/**
 * @author Valkream Team
 * @license MIT-NC
 */

const fse = require("fs-extra");
const SevenDtoDDirsManager = require("./SevenDtoDDirsManager.js");

class SevenDtoDGameManager {
  init() {
    this.gameRootDir = SevenDtoDDirsManager.gameRootPath();
  }

  async uninstall() {
    this.init();
    try {
      await fse.remove(this.gameRootDir);
      await fse.ensureDir(this.gameRootDir);
    } catch (err) {
      throw new Error(`Échec de la désinstallation : ${err.message}`);
    }
  }
}

module.exports = new SevenDtoDGameManager();
