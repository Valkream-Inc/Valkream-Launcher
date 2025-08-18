/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const path = require("path");
const fse = require("fs-extra");
const { shell } = require("electron");

const DirsManager = require("./dirsManager.js");
const SettingsManager = require("./settingsManager.js");

class SteamManager {
  async init() {
    this.gameDir = await DirsManager.gamePath();
  }

  install() {
    const steamValheimPath = SettingsManager.getSetting("valheim_steam_path");
    fse.copySync(path.join(steamValheimPath), this.gameDir);
  }

  async update() {
    return await shell.openExternal("steam://rungameid/892970");
  }

  async open() {
    return await shell.openExternal("steam://store/892970");
  }
}

const steamManager = new SteamManager();
steamManager.init();
module.exports = steamManager;
