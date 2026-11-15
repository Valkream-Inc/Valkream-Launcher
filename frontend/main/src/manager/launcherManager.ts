/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { execFile } = require("child_process");
const { shell } = require("electron");
const fs = require("fs");
const MainWindow = require("../windows/mainWindow.js");

const { pkg } = require("../constants/index.js");
const DirsManager = require("./dirsManager.js");
const FilesManager = require("./filesManager.js");

class LauncherManager {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    this.installDir = DirsManager.launcherRootPath();
    this.uninstallerPath = FilesManager.uninstallerPath();
    this.initialized = true;
  }

  getVersion() {
    return pkg?.version || "0.0.0";
  }

  async openInstallationFolder() {
    await this.init();
    return await shell.openPath(this.installDir);
  }

  async uninstall() {
    await this.init();

    if (!this.uninstallerPath || !fs.existsSync(this.uninstallerPath)) {
      throw new Error("Uninstallateur introuvable !");
    }

    return new Promise((resolve, reject) => {
      execFile(this.uninstallerPath, (error, stdout, stderr) => {
        if (error) {
          console.error("Erreur execFile:", error);
          return reject(new Error(stderr || error.message));
        }
        resolve({ success: true, output: stdout });
      });
    });
  }

  hide() {
    const mainWindow = MainWindow.getWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
    }
  }

  show() {
    const mainWindow = MainWindow.getWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  }

  close() {
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
module.exports = launcherManager;
