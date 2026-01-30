/**
 * @author Valkream Team
 * @license MIT-NC
 */

const fs = require("fs/promises");
const { shell } = require("electron");

const {
  dowloadMultiplefiles,
  unZipMultipleFiles,
} = require("../../utils/index.js");

const SevenDtoDDirsManager = require("./SevenDtoDDirsManager.js");
const SevenDtoDFilesManager = require("./SevenDtoDFilesManager.js");
const SevenDtoDLinksManager = require("./SevenDtoDLinksManager.js");

const SettingsManager = require("../settingsManager.js");
const LauncherManager = require("../launcherManager.js");
const InfosManager = require("../infosManager.js");

class SevenDtoDGameManager {
  async init() {
    if (await InfosManager.getIsServerReachable()) {
      this.gameZipLink = await SevenDtoDLinksManager.gameZipLink();
      this.gameZipPath = SevenDtoDFilesManager.gameZipPath();
    }

    this.gameRootDir = SevenDtoDDirsManager.gameRootPath();
    this.gameDir = SevenDtoDDirsManager.gamePath();
    this.gameExePath = SevenDtoDFilesManager.gameExePath();
    return;
  }

  async dowloadGame(
    callback = (text, downloadedBytes, totalBytes, percent, speed) => {},
    text = "Téléchargement...",
  ) {
    await this.init();
    return dowloadMultiplefiles(
      [{ url: this.gameZipLink, destPath: this.gameZipPath }],
      (data) =>
        callback(
          text,
          data.downloadedBytes,
          data.totalBytes,
          data.percent,
          data.speed,
        ),
    );
  }

  async unzipGame(
    callback = (text, decompressedBytes, totalBytes, percent, speed) => {},
    text = "Décompression...",
  ) {
    await this.init();
    return unZipMultipleFiles(
      [{ path: this.gameZipPath, destPath: this.gameDir }],
      (data) =>
        callback(
          text,
          data.decompressedBytes,
          data.totalBytes,
          data.percent,
          data.speed,
        ),
    );
  }

  async finishGame() {
    await this.init();
    await fse.remove(this.gameZipPath);
    return;
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

  async getIsInstalled() {
    await this.init();
    try {
      await fs.access(this.gameDir);
      await fs.access(this.gameExePath);
      return true;
    } catch {
      return false;
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

  async play() {
    await this.init();
    const behavior = await SettingsManager.getSetting(
      "launcherBehaviorWithSevenDtoD",
    );

    const launchGame = () =>
      new Promise((resolve, reject) => {
        const child = execFile(this.gameExePath, (err) => {
          if (err) reject(err);
        });
        child.on("exit", resolve);
      });

    switch (behavior) {
      case "nothing":
        await shell.openPath(this.gameExePath);
        break;
      case "close":
        await shell.openPath(this.gameExePath);
        LauncherManager.close();
        break;
      case "hide":
        LauncherManager.hide();
        await launchGame();
        LauncherManager.show();
        break;
      default:
        await shell.openPath(this.gameExePath);
        LauncherManager.close();
        break;
    }
  }
}

module.exports = new SevenDtoDGameManager();
