/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const path = require("path");
const { app } = require("electron");

const { newDir } = require("../../utils/index.js");
const { isDev } = require("../index.js");

const DirsManager = require("./dirsManager.js");

class FilesManager {
  constructor() {
    this.dirsManager = new DirsManager();
  }

  getGameZipPath = async () => {
    const gameRootPath = await this.dirsManager.gameRootPath();
    return path.join(gameRootPath, "game.zip");
  };

  getBepInExZipPath = async () => {
    const gameRootPath = await this.dirsManager.gameRootPath();
    return path.join(gameRootPath, "bepinex.zip");
  };

  getModpackZipPath = async () => {
    const gameRootPath = await this.dirsManager.gameRootPath();
    return path.join(gameRootPath, "modpack.zip");
  };
}

module.exports = FilesManager;
