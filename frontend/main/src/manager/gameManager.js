/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const path = require("path");
const fs = require("fs/promises");
const fse = require("fs-extra");
const { shell } = require("electron");
const { cleanGameFolder } = require("../utils/function/cleanGameFolder");
const { execFile } = require("child_process");

const VersionManager = require("./versionManager.js");
const LinksManager = require("./linksManager.js");
const FilesManager = require("./filesManager.js");
const DirsManager = require("./dirsManager.js");

const SettingsManager = require("./settingsManager.js");
const LauncherManager = require("./launcherManager.js");
const InfosManager = require("./infosManager.js");

const {
  isFolderPathSecured,
  dowloadMultiplefiles,
  unZipMultipleFiles,
} = require("../utils/index.js");

class GameManager {
  async init() {
    if (await InfosManager.getIsServerReachableFromInternal()) {
      this.gameZipLink = await LinksManager.gameZipLink();
      this.gameZipPath = FilesManager.gameZipPath();

      this.bepInExZipLink = await LinksManager.bepInExZipLink();
      this.bepInExZipPath = FilesManager.bepInExZipPath();
    }

    this.gameRootDir = DirsManager.gameRootPath();
    this.gameDir = DirsManager.gamePath();
    this.gameExePath = FilesManager.gameExePath();
    this.preservedDir = DirsManager.gamePreservedPath();

    if (await VersionManager.getIsInstalled()) {
      const localConfig = await VersionManager.getLocalVersionConfig();
      this.gameFolderToRemove = localConfig?.modpack?.gameFolderToRemove || [];
      this.configGameFolderToPreserve =
        localConfig?.modpack?.gameFolderToPreserve || [];
      this.modsAdmin = localConfig?.modpack?.admin_mods || [];
      this.modsBoostFPS = localConfig?.modpack?.boostfps_mods || [];

      this.gameFolderToPreserve = [
        ...this.configGameFolderToPreserve,
        ...this.modsAdmin.map((mod) => `/BepInEx/plugins/${mod}/`),
        ...this.modsBoostFPS.map((mod) => `/BepInEx/plugins/${mod}/`),
      ];

      await this.restoreGameFolder({ noInit: true });
    }

    return;
  }

  async dowloadGame(
    callback = (text, downloadedBytes, totalBytes, percent, speed) => {},
    text = "Téléchargement..."
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
          data.speed
        )
    );
  }

  async unzipGame(
    callback = (text, decompressedBytes, totalBytes, percent, speed) => {},
    text = "Décompression..."
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
          data.speed
        )
    );
  }

  async finishGame() {
    await this.init();
    await fse.remove(this.gameZipPath);
    return;
  }

  async dowloadBepInEx(
    callback = (text, downloadedBytes, totalBytes, percent, speed) => {},
    text = "Téléchargement de BepInEx..."
  ) {
    await this.init();
    return dowloadMultiplefiles(
      [{ url: this.bepInExZipLink, destPath: this.bepInExZipPath }],
      (data) =>
        callback(
          text,
          data.downloadedBytes,
          data.totalBytes,
          data.percent,
          data.speed
        )
    );
  }

  async unzipBepInEx(
    callback = (text, decompressedBytes, totalBytes, percent, speed) => {},
    text = "Décompression de BepInEx..."
  ) {
    await this.init();
    return unZipMultipleFiles(
      [{ path: this.bepInExZipPath, destPath: this.gameDir }],
      (data) =>
        callback(
          text,
          data.decompressedBytes,
          data.totalBytes,
          data.percent,
          data.speed
        )
    );
  }

  async finishBepInEx() {
    await this.init();
    await fse.remove(this.bepInExZipPath);
    return;
  }

  async openFolder() {
    await this.init();
    try {
      await fs.access(this.gameDir);
      return shell.openPath(this.gameDir);
    } catch {
      throw new Error("Le dossier du jeu n'existe pas !");
    }
  }

  async clean(gameFolderToRemove = this.gameFolderToRemove || []) {
    await this.init();
    const securedGameFolderToRemove = gameFolderToRemove.filter((folder) =>
      isFolderPathSecured(
        this.gameDir,
        folder,
        (relativePath) =>
          relativePath === "BepInEx/cache" ||
          relativePath.startsWith("BepInEx/plugins/") ||
          relativePath.startsWith("BepInEx/config/")
      )
    );

    await cleanGameFolder(this.gameDir, securedGameFolderToRemove);
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
    await this.init();
    try {
      await fse.remove(this.gameRootDir);
      await fse.ensureDir(this.gameRootDir);
    } catch (err) {
      throw new Error(`Échec de la désinstallation : ${err.message}`);
    }
  }

  async preserveGameFolder(
    gameFolderToPreserve = this.gameFolderToPreserve || []
  ) {
    await this.init();
    await this.restoreGameFolder({ noInit: true });
    if (!gameFolderToPreserve?.length) return;

    if (await fse.pathExists(this.preservedDir)) {
      await fse.remove(this.preservedDir);
    }
    await fse.ensureDir(this.preservedDir);

    const foldersToMove = gameFolderToPreserve.filter((folder) =>
      isFolderPathSecured(
        folder,
        this.gameDir,
        (relativePath) =>
          relativePath.startsWith("BepInEx/plugins/") ||
          relativePath.startsWith("BepInEx/config/")
      )
    );

    await Promise.all(
      foldersToMove.map(async (folder) => {
        const source = path.join(this.gameDir, folder);
        const destination = path.join(this.preservedDir, folder);

        if (await fse.pathExists(source)) {
          await fse.ensureDir(path.dirname(destination));
          await fse.copy(source, destination, { overwrite: true });
        }
      })
    );
  }

  async restoreGameFolder(props) {
    if (!props?.noInit) await this.init();

    try {
      if (!(await fse.pathExists(this.preservedDir))) return;

      await fse.copy(this.preservedDir, this.gameDir, {
        overwrite: true,
        recursive: true,
      });

      await fse.remove(this.preservedDir);
      await fse.ensureDir(this.preservedDir);
    } catch (err) {
      throw new Error(
        `Impossible de restaurer le dossier du jeu : ${err.message}`
      );
    }
  }

  async play() {
    await this.init();
    const behavior = await SettingsManager.getSetting("launcherBehavior");

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

module.exports = new GameManager();
