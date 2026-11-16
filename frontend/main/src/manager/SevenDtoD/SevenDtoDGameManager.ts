/**
 * @author Valkream Team
 * @license MIT-NC
 */

import fs from "fs/promises";
import fse from "fs-extra";
import { shell } from "electron";
import { execFile } from "child_process";
import type { ProgressCallback } from "@shared/types";

import { dowloadMultiplefiles, unZipMultipleFiles } from "../../utils";

import SevenDtoDDirsManager from "./SevenDtoDDirsManager";
import SevenDtoDFilesManager from "./SevenDtoDFilesManager";
import SevenDtoDLinksManager from "./SevenDtoDLinksManager";

import SettingsManager from "../settingsManager";
import LauncherManager from "../launcherManager";
import InfosManager from "../infosManager";

class SevenDtoDGameManager {
  gameZipLink!: string;
  gameZipPath!: string;
  gameRootDir!: string;
  gameDir!: string;
  gameExePath!: string;

  async init(): Promise<void> {
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

  async finishGame(): Promise<void> {
    await this.init();
    await fse.remove(this.gameZipPath);
    return;
  }

  async openFolder(): Promise<string> {
    await this.init();
    try {
      await fs.access(this.gameDir);
      return shell.openPath(this.gameDir);
    } catch {
      throw new Error("Le dossier du jeu n'existe pas !");
    }
  }

  async getIsInstalled(): Promise<boolean> {
    await this.init();
    try {
      await fs.access(this.gameDir);
      await fs.access(this.gameExePath);

      return true;
    } catch {
      return false;
    }
  }

  async uninstall(): Promise<void> {
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

  async play(): Promise<void> {
    await this.init();
    const behavior = await SettingsManager.getSetting(
      "launcherBehaviorWithSevenDtoD"
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

export default new SevenDtoDGameManager();
