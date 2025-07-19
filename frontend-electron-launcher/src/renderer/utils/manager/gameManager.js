const path = require("path");
const fs = require("fs");
const { ipcRenderer, shell } = require("electron");
const { cleanGameFolder } = require("valkream-function-lib");
const { execFile } = require("child_process");
const { platform } = require("os");

const { VersionManager, Manager } = require(window.PathsManager.getUtils());
const { database } = require(window.PathsManager.getSharedUtils());
const { baseUrl } = require(window.PathsManager.getConstants());

class GameManager {
  static id = "game-manager";

  constructor() {
    this.init();
    this.db = new database();
  }

  async init() {
    this.appdataDir = path.join(await ipcRenderer.invoke("data-path"));
    this.serverGameRoot = path.join(baseUrl, "game/latest");

    this.gameZipLink = path.join(
      this.serverGameRoot,
      `build-game-${platform()}.zip`
    );
    this.gameZipPath = path.join(this.appdataDir, "game", "build-game.zip");

    this.gameDir = path.join(this.appdataDir, "game", "Valheim");
    this.gameExePath = path.join(this.gameDir, "ValheimValkream.exe");

    for (const dir of [this.appdataDir, this.gameDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  async dowload(
    callback = (text, downloadedBytes, totalBytes, percent, speed) => {}
  ) {
    return new Manager().handleError({
      ensure: fs.existsSync(this.gameDir),
      then: async () => {
        ipcRenderer.invoke(
          "download-multiple-files",
          [
            {
              url: this.gameZipLink,
              destPath: this.gameZipPath,
            },
          ],
          GameManager.id + "-download"
        );

        ipcRenderer.on(
          `download-multi-progress-${GameManager.id}-download`,
          (event, data) => {
            callback(...data);
          }
        );
      },
    });
  }

  async unzip(callback = () => {}) {
    return new Manager().handleError({
      ensure: fs.existsSync(this.gameZipPath),
      then: async () => {
        ipcRenderer.send(
          "multiple-unzip",
          [{ path: this.gameZipPath, destPath: this.gameDir }],
          GameManager.id + "-unzip"
        );

        ipcRenderer.on(
          `multi-unzip-progress-${GameManager.id}-unzip`,
          (event, data) => {
            callback(...data);
          }
        );
      },
    });
  }

  async installBepInEx(callback = () => {}) {
    const bepInExUrl = await new VersionManager()
      .getOnlineVersionConfig()
      .then((config) => config.bepInExUrl[platform()]);

    return new Manager().handleError({
      ensure: fs.existsSync(this.gameDir),
      then: () => {
        ipcRenderer.invoke(
          "download-multiple-files",
          [
            {
              url: bepInExUrl,
              destPath: path.join(this.gameDir, "BepInEx"),
            },
          ],
          GameManager.id + "-download-bepInEx"
        );

        ipcRenderer.on(
          `download-multi-progress-${GameManager.id}-download-bepInEx`,
          (event, data) => {
            callback(...data);
          }
        );
      },
    });
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

  getIsInstalled() {
    return fs.existsSync(this.gameDir) && fs.existsSync(this.gameExePath);
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
    return new Manager().handleError({
      ensure: fs.existsSync(this.gameExePath),
      then: () => {
        ipcRenderer.send("main-window-hide");
        const child = execFile(this.gameExePath, (err) => {
          throw new Error(err);
        });
        child.on("exit", () => {
          ipcRenderer.send("main-window-show");
        });
      },
    });
  }
}

const gameManager = new GameManager();
gameManager.init();
module.exports = gameManager;
