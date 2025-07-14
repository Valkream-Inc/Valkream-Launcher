const path = require("path");
const fs = require("fs");
const { ipcRenderer, shell } = require("electron");
const { cleanGameFolder } = require("valkream-function-lib");
const Manager = require("./manager.js");
const {
  baseUrl,
  gameFolderToRemove,
} = require(window.PathsManager.getConstants());
class GameManager {
  constructor() {
    this.init();
  }

  async init() {
    this.appdataDir = path.join(await ipcRenderer.invoke("data-path"));
    this.serverGameRoot = path.join(baseUrl, "game/latest");

    this.gameVersionFileLink = path.join(this.serverGameRoot, "latest.yml");
    this.gameVersionFilePath = path.join(this.appdataDir, "latest.yml");

    this.gameZipLink = path.join(this.serverGameRoot, "game.zip");
    this.gameZipPath = path.join(this.appdataDir, "game.zip");

    this.gameDir = path.join(this.appdataDir, "game", "Valheim Valkream Data");
    this.gameExePath = path.join(this.gameDir, "ValheimValkream.exe");

    for (const dir of [this.appdataDir, this.gameDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  install() {
    return true;
  }

  async openFolder() {
    return new Manager().handleError({
      ensure: fs.existsSync(this.gameDir),
      then: async () => await shell.openPath(this.gameDir),
    });
  }

  clean() {
    return new Manager().handleError({
      ensure: fs.existsSync(this.gameDir),
      then: () => cleanGameFolder(this.gameDir, gameFolderToRemove),
    });
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
    return new Manager().handleError({
      ensure: fs.readdirSync(this.gameDir).length !== 0,
      then: () => {
        fs.rmSync(this.gameDir, { recursive: true });
        fs.mkdirSync(this.gameDir, { recursive: true });
      },
    });
  }

  play() {
    return true;
  }
}

const gameManager = new GameManager();
gameManager.init();
module.exports = gameManager;
