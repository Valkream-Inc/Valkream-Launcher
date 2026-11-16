/**
 * @author Valkream Team
 * @license MIT-NC
 */

import path from "path";
import fs from "fs/promises";
import fse from "fs-extra";
import { shell } from "electron";
import { cleanGameFolder } from "../../utils/function/cleanGameFolder";
import { execFile } from "child_process";

import type { ProgressCallback } from "@shared/types";
import type { ValheimRestoreGameFolderOptions } from "../../types/valheim";

import ValheimVersionManager from "./ValheimVersionManager";
import ValheimLinksManager from "./ValheimLinksManager";
import ValheimFilesManager from "./ValheimFilesManager";
import ValheimDirsManager from "./ValheimDirsManager";

import SettingsManager from "../settingsManager";
import LauncherManager from "../launcherManager";
import InfosManager from "../infosManager";

import {
  isFolderPathSecured,
  dowloadMultiplefiles,
  unZipMultipleFiles,
} from "../../utils/index";

class ValheimGameManager {
  gameZipLink!: string;
  gameZipPath!: string;
  bepInExZipLink!: string;
  bepInExZipPath!: string;
  gameRootDir!: string;
  gameDir!: string;
  gameExePath!: string;
  preservedDir!: string;
  gameFolderToRemove!: string[];
  configGameFolderToPreserve!: string[];
  modsAdmin!: string[];
  modsBoostFPS!: string[];
  gameFolderToPreserve!: string[];

  async init() {
    if (await InfosManager.getIsServerReachable()) {
      this.gameZipLink = await ValheimLinksManager.gameZipLink();
      this.gameZipPath = ValheimFilesManager.gameZipPath();

      this.bepInExZipLink = await ValheimLinksManager.bepInExZipLink();
      this.bepInExZipPath = ValheimFilesManager.bepInExZipPath();
    }

    this.gameRootDir = ValheimDirsManager.gameRootPath();
    this.gameDir = ValheimDirsManager.gamePath();
    this.gameExePath = ValheimFilesManager.gameExePath();
    this.preservedDir = ValheimDirsManager.gamePreservedPath();

    if (await ValheimVersionManager.getIsInstalled()) {
      const localConfig = await ValheimVersionManager.getLocalVersionConfig();
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
    callback: ProgressCallback = () => {},
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
    callback: ProgressCallback = () => {},
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
    callback: ProgressCallback = () => {},
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
    callback: ProgressCallback = () => {},
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

  async clean(gameFolderToRemove: string[] = this.gameFolderToRemove || []) {
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
      await fs.rm(this.gameRootDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 200,
      });

      await fs.mkdir(this.gameRootDir, { recursive: true });
    } catch (err) {
      throw new Error(
        `Échec de la désinstallation : ${err instanceof Error ? err.message : String(err)}`,
        { cause: err },
      );
    }
  }

  async preserveGameFolder(
    gameFolderToPreserve: string[] = this.gameFolderToPreserve || []
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

  async restoreGameFolder(props?: ValheimRestoreGameFolderOptions) {
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
        `Impossible de restaurer le dossier du jeu : ${err instanceof Error ? err.message : String(err)}`,
        { cause: err },
      );
    }
  }

  async play() {
    await this.init();
    const behavior = await SettingsManager.getSetting(
      "launcherBehaviorWithValheim"
    );

    const launchGame = () =>
      new Promise<void>((resolve, reject) => {
        const child = execFile(this.gameExePath, (err) => {
          if (err) reject(err);
        });
        child.on("exit", () => resolve());
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

export default new ValheimGameManager();
