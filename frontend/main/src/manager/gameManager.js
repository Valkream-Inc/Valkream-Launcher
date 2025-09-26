/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const path = require("path");
const fs = require("fs/promises");
const fse = require("fs-extra");
const { shell } = require("electron");
const { cleanGameFolder } = require("valkream-function-lib");
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
    } else {
      this.gameRootDir = DirsManager.gameRootPath();
      this.gameDir = DirsManager.gamePath();
      this.gameExePath = FilesManager.gameExePath();
      this.preservedDir = DirsManager.gamePreservedPath();

      await this.restoreGameFolder({ noInit: true });
    }

    return;
  }

  async dowload(
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

  async unzip(
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
      await fs.rm(this.gameRootDir, { recursive: true, force: true });
      await fs.mkdir(this.gameRootDir, { recursive: true });
    } catch (err) {
      throw new Error(`Échec de la désinstallation : ${err.message}`);
    }
  }

  async preserveGameFolder(
    gameFolderToPreserve = this.gameFolderToPreserve || []
  ) {
    await this.init();
    if (!gameFolderToPreserve?.length) return;

    if (fs.existSync(this.preservedDir))
      await fs.promises.rm(this.preservedDir, { recursive: true, force: true });
    await fs.promises.mkdir(this.preservedDir, { recursive: true });

    const foldersToMove = gameFolderToPreserve.filter((folder) =>
      isFolderPathSecured(
        this.gameDir,
        folder,
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
          await fse.move(source, destination, { overwrite: true });
        }
      })
    );
  }

  async restoreGameFolder(props) {
    if (!props?.noInit) await this.init();
    if (!(await fse.pathExists(this.preservedDir))) return;

    await fse.copy(this.preservedDir, this.gameDir, {
      overwrite: true,
      recursive: true,
    });
    await fs.rm(this.preservedDir, { recursive: true, force: true });
  }

  async play(onExit = () => {}) {
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
        onExit();
        break;
      default:
        await shell.openPath(this.gameExePath);
        LauncherManager.close();
        break;
    }
  }
}

module.exports = new GameManager();
