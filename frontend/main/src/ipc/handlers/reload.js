const GameManager = require("../../manager/gameManager");
const ThunderstoreManager = require("../../manager/thunderstoreManager");
const VersionManager = require("../../manager/versionManager");
const LauncherManager = require("../../manager/launcherManager");
const SteamManager = require("../../manager/steamManager");

class Reload {
  async init() {
    await GameManager.init();
    await ThunderstoreManager.init();
    await VersionManager.init();
    await LauncherManager.init();
    await SteamManager.init();
    return true;
  }
}

const reloadManager = new Reload();
module.exports = reloadManager;
