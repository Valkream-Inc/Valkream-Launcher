/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");
const { shell } = require("electron");
const { cleanGameFolder } = require("valkream-function-lib");
const { execFile } = require("child_process");
const { platform } = require("os");

const VersionManager = require("./versionManager.js");

const LinksManager = require("./linksManager.js");
const FilesManager = require("./filesManager.js");
const DirsManager = require("./dirsManager.js");

const SettingsManager = require("./settingsManager.js");
const LauncherManager = require("./launcherManager.js");

const CheckInfos = require("../ipc/handlers/check-infos.js");
const {
  isFolderPathSecured,
  dowloadMultiplefiles,
  unZipMultipleFiles,
} = require("../utils/index.js");

class GameManager {
  async init() {
    // 🔸 Étape 1 : Configuration des liens vers les fichiers
    if ((await CheckInfos.getInfos()).isServerReachable) {
      this.gameZipLink = await LinksManager.gameZipLink();
      this.gameZipPath = FilesManager.gameZipPath();

      this.bepInExZipLink = await LinksManager.bepInExZipLink();
      this.bepInExZipPath = FilesManager.bepInExZipPath();
    }

    if (VersionManager.getIsInstalled()) {
      // 🔸 Étape 2 : Configuration des dossiers à supprimer
      this.gameFolderToRemove = (
        await VersionManager.getLocalVersionConfig()
      ).modpack?.gameFolderToRemove;

      // 🔸 Étape 3 : Configuration des dossiers à conserver
      this.configGameFolderToPreserve =
        (await VersionManager.getLocalVersionConfig()).modpack
          ?.gameFolderToPreserve || [];
      this.modsAdmin =
        (await VersionManager.getLocalVersionConfig()).modpack?.admin_mods ||
        [];
      this.modsBoostFPS =
        (await VersionManager.getLocalVersionConfig()).modpack?.boostfps_mods ||
        [];
      this.gameFolderToPreserve = [
        ...this.configGameFolderToPreserve,
        ...this.modsAdmin.map((mod) => `/BepInEx/plugins/${mod}/`),
        ...this.modsBoostFPS.map((mod) => `/BepInEx/plugins/${mod}/`),
      ];
    }

    // 🔸 Étape 4 : Configuration des dossiers
    this.gameRootDir = await DirsManager.gameRootPath();
    this.gameDir = await DirsManager.gamePath();
    this.gameExePath = await FilesManager.gameExePath();
    this.preservedDir = await DirsManager.gamePreservedPath();

    await this.restoreGameFolder();
  }

  async dowload(
    callback = (text, downloadedBytes, totalBytes, percent, speed) => {},
    text = "Téléchargement..."
  ) {
    return await dowloadMultiplefiles(
      [
        {
          url: this.gameZipLink,
          destPath: this.gameZipPath,
        },
      ],
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
    return await unZipMultipleFiles(
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
    return await dowloadMultiplefiles(
      [
        {
          url: this.bepInExZipLink,
          destPath: this.bepInExZipPath,
        },
      ],
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
    callback = (decompressedBytes, totalBytes, percent, speed) => {},
    text = "Décompression de BepInEx..."
  ) {
    return await unZipMultipleFiles(
      [
        {
          path: this.bepInExZipPath,
          destPath: this.gameDir,
        },
      ],
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
    return await shell.openPath(this.gameDir);
  }

  async clean(gameFolderToRemove = this.gameFolderToRemove || []) {
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

    cleanGameFolder(this.gameDir, securedGameFolderToRemove);
  }

  async getIsInstalled() {
    return fs.existsSync(this.gameDir) && fs.existsSync(this.gameExePath);
  }

  async uninstall() {
    fs.rmSync(this.gameRootDir, { recursive: true });
    fs.mkdirSync(this.gameRootDir, { recursive: true });
  }

  async preserveGameFolder(gameFolderToPreserve = this.gameFolderToPreserve) {
    if (fs.existsSync(this.preservedDir))
      fs.rmSync(this.preservedDir, { recursive: true });
    fs.mkdirSync(this.preservedDir, { recursive: true });

    const foldersToMove = gameFolderToPreserve.filter((folder) =>
      isFolderOk(
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

        if (fs.existsSync(source)) {
          await fse.move(source, destination, { overwrite: true });
        }
      })
    );
  }

  async restoreGameFolder() {
    if (!fs.existsSync(this.preservedDir)) return;

    fse.copySync(this.preservedDir, this.gameDir, {
      overwrite: true,
      recursive: true,
    });
    fs.rmSync(this.preservedDir, { recursive: true });
  }

  async play(onExit = () => {}) {
    // Lecture du paramètre launcherBehavior
    const behavior = await SettingsManager.getSetting("launcherBehavior");

    // Action avant le lancement du jeu
    if (behavior === "nothing") {
      await shell.openPath(this.gameExePath);
    } else if (behavior === "close") {
      await shell.openPath(this.gameExePath);
      LauncherManager.close();
    } else if (behavior === "hide") {
      LauncherManager.hide();
      const child = execFile(this.gameExePath, (err) => {
        if (err) throw new Error(err);
      });
      child.on("exit", () => {
        LauncherManager.show();
        onExit();
      });
    } else {
      await shell.openPath(this.gameExePath);
      LauncherManager.close();
    }
  }
}

const gameManager = new GameManager();
gameManager.init();
module.exports = gameManager;
