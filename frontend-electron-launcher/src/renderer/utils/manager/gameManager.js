const path = require("path");
const { baseUrl } = require(window.PathsManager.getConstants());

const appdataDir = path.join(process.cwd(), ".valkream-launcher");
const serverGameRoot = path.join(baseUrl, "game/latest");

const gameVersionFileName = "latest.yml";
const gameVersionFileLink = path.join(serverGameRoot, gameVersionFileName);
const gameVersionFilePath = path.join(appdataDir, gameVersionFileName);

const gameZipName = "game.zip";
const gameZipLink = path.join(serverGameRoot, gameZipName);
const gameZipPath = path.join(appdataDir, gameZipName);

const gameDir = path.join(appdataDir, "Valheim Valkream Data");
const gameExePath = path.join(gameDir, "ValheimValkream.exe");

class GameManager {
  install() {
    return true;
  }

  openFolder() {
    return true;
  }

  cleanFolder() {
    return true;
  }

  getLocalVersion() {
    return "0.0.0";
  }

  getOnlineVersion() {
    return "0.0.0";
  }

  getLocalHash() {
    return { config: "0", plugins: "0" };
  }

  getOnlineHash() {
    return { config: "0", plugins: "0" };
  }

  update() {
    return true;
  }

  uninstall() {
    return true;
  }

  play() {
    return true;
  }
}

module.exports = GameManager;
