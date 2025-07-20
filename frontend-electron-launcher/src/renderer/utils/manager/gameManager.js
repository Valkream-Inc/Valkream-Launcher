const path = require("path");
const fs = require("fs");
const { ipcRenderer, shell } = require("electron");
const { cleanGameFolder } = require("valkream-function-lib");
const { execFile } = require("child_process");
const { platform } = require("os");

const Manager = require("./manager.js");
const VersionManager = require("./versionManager.js");
const {
  database,
  isServerReachable,
} = require(window.PathsManager.getSharedUtils());
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

    const isServerConnected = await isServerReachable();
    if (isServerConnected) {
      this.gameZipLink = await VersionManager.toURL(
        (
          await VersionManager.getOnlineVersionConfig()
        ).valheim.dowload_url[platform()]
      );
      this.gameZipPath = path.join(this.appdataDir, "game", "build-game.zip");

      this.bepInExZipLink = await VersionManager.toURL(
        (
          await VersionManager.getOnlineVersionConfig()
        ).bepinex.dowload_url[platform()]
      );
      this.bepInExZipPath = path.join(
        this.appdataDir,
        "game",
        "build-bepinex.zip"
      );
    }

    this.gameDir = path.join(this.appdataDir, "game", "Valheim");
    this.gameExePath = path.join(this.gameDir, "Valheim.exe");

    for (const dir of [this.appdataDir, this.gameDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  async dowload(
    callback = (text, downloadedBytes, totalBytes, percent, speed) => {},
    text = "Téléchargement..."
  ) {
    return new Manager().handleError({
      ensure: fs.existsSync(this.gameDir),
      then: async () => {
        return new Promise((resolve, reject) => {
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

          const progressListener = (event, data) => {
            callback(
              text,
              data.downloadedBytes,
              data.totalBytes,
              data.percent,
              data.speed
            );
            if (data.downloadedBytes === data.totalBytes) {
              ipcRenderer.removeListener(
                `download-multi-progress-${GameManager.id}-download`,
                progressListener
              );
              resolve(true);
            }
          };

          ipcRenderer.on(
            `download-multi-progress-${GameManager.id}-download`,
            progressListener
          );
        });
      },
    });
  }

  async unzip(
    callback = (text, decompressedBytes, totalBytes, percent, speed) => {},
    text = "Décompression..."
  ) {
    return new Manager().handleError({
      ensure: fs.existsSync(this.gameZipPath),
      then: async () => {
        return new Promise((resolve, reject) => {
          ipcRenderer.invoke(
            "multiple-unzip",
            [{ path: this.gameZipPath, destPath: this.gameDir }],
            GameManager.id + "-unzip"
          );

          const progressListener = (event, data) => {
            callback(
              text,
              data.decompressedBytes,
              data.totalBytes,
              data.percent,
              data.speed
            );
            if (data.decompressedBytes === data.totalBytes) {
              ipcRenderer.removeListener(
                `multi-unzip-progress-${GameManager.id}-unzip`,
                progressListener
              );

              fs.unlinkSync(this.gameZipPath);
              resolve(true);
            }
          };

          ipcRenderer.on(
            `multi-unzip-progress-${GameManager.id}-unzip`,
            progressListener
          );
        });
      },
    });
  }

  async dowloadBepInEx(
    callback = (text, downloadedBytes, totalBytes, percent, speed) => {},
    text = "Téléchargement de BepInEx..."
  ) {
    return new Manager().handleError({
      ensure: fs.existsSync(this.gameDir),
      then: async () => {
        return new Promise((resolve, reject) => {
          ipcRenderer.invoke(
            "download-multiple-files",
            [
              {
                url: this.bepInExZipLink,
                destPath: this.bepInExZipPath,
              },
            ],
            GameManager.id + "-download-bepInEx"
          );

          const progressListener = (event, data) => {
            callback(
              text,
              data.downloadedBytes,
              data.totalBytes,
              data.percent,
              data.speed
            );
            if (data.downloadedBytes === data.totalBytes) {
              ipcRenderer.removeListener(
                `download-multi-progress-${GameManager.id}-download-bepInEx`,
                progressListener
              );
              resolve(true);
            }
          };

          ipcRenderer.on(
            `download-multi-progress-${GameManager.id}-download-bepInEx`,
            progressListener
          );
        });
      },
    });
  }

  async unzipBepInEx(
    callback = (decompressedBytes, totalBytes, percent, speed) => {},
    text = "Décompression de BepInEx..."
  ) {
    return new Manager().handleError({
      ensure: fs.existsSync(this.bepInExZipPath),
      then: async () => {
        return new Promise((resolve, reject) => {
          ipcRenderer.invoke(
            "multiple-unzip",
            [
              {
                path: this.bepInExZipPath,
                destPath: this.gameDir,
              },
            ],
            GameManager.id + "-unzip-bepInEx"
          );

          const progressListener = (event, data) => {
            callback(
              text,
              data.decompressedBytes,
              data.totalBytes,
              data.percent,
              data.speed
            );
            if (data.decompressedBytes === data.totalBytes) {
              ipcRenderer.removeListener(
                `multi-unzip-progress-${GameManager.id}-unzip-bepInEx`,
                progressListener
              );

              fs.unlinkSync(this.bepInExZipPath);
              resolve(true);
            }
          };

          ipcRenderer.on(
            `multi-unzip-progress-${GameManager.id}-unzip-bepInEx`,
            progressListener
          );
        });
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

  async getIsInstalled() {
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
