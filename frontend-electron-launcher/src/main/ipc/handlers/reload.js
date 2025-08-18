const {
  GameManager,
  ThunderstoreManager,
  VersionManager,
  LauncherManager,
  SteamManager,
} = require("../../manager");

class Reload {
  async init() {
    await GameManager.init();
    await ThunderstoreManager.init();
    await VersionManager.init();
    await LauncherManager.init();
    await SteamManager.init();
  }
}

const reloadManager = new Reload();
reloadManager.init();
module.exports = reloadManager;
