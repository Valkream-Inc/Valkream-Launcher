/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { execFile } from "child_process";
import { shell } from "electron";
import fs from "fs";

import type { ActionResult } from "@shared/types";

import * as MainWindow from "../windows/mainWindow";

import { pkg } from "../constants/index";
import DirsManager from "./dirsManager";
import FilesManager from "./filesManager";

class LauncherManager {
  initialized: boolean;
  installDir = "";
  uninstallerPath = "";

  constructor() {
    this.initialized = false;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.installDir = DirsManager.launcherRootPath();
    this.uninstallerPath = FilesManager.uninstallerPath();
    this.initialized = true;
  }

  getVersion(): string {
    return pkg?.version || "0.0.0";
  }

  async openInstallationFolder(): Promise<string> {
    await this.init();
    return await shell.openPath(this.installDir);
  }

  async uninstall(): Promise<ActionResult> {
    await this.init();

    if (!this.uninstallerPath || !fs.existsSync(this.uninstallerPath)) {
      throw new Error("Uninstallateur introuvable !");
    }

    return new Promise<ActionResult>((resolve, reject) => {
      execFile(this.uninstallerPath, (error, stdout, stderr) => {
        if (error) {
          console.error("Erreur execFile:", error);
          return reject(new Error(stderr || error.message));
        }
        resolve({ success: true, output: stdout });
      });
    });
  }

  hide(): void {
    const mainWindow = MainWindow.getWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
    }
  }

  show(): void {
    const mainWindow = MainWindow.getWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  }

  close(): void {
    const mainWindow = MainWindow.getWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
  }
}

const launcherManager = new LauncherManager();
launcherManager
  .init()
  .catch((err) => console.error("Erreur init LauncherManager:", err));
export default launcherManager;
