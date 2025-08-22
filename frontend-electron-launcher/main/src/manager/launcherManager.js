/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { execFile } = require("child_process");
const { shell } = require("electron");
const fs = require("fs");
const path = require("path");
const MainWindow = require("../windows/mainWindow.js");

const { pkg } = require("../constants/index.js");
const DirsManager = require("./dirsManager.js");
const FilesManager = require("./filesManager.js");

class LauncherManager {
  async init() {
    this.installDir = await DirsManager.launcherRootPath();
    this.uninstallerPath = await FilesManager.uninstallerPath();
  }

  getVersion() {
    if (pkg && pkg.version) return pkg.version;
    else return "0.0.0";
  }

  async openInstallationFolder() {
    return await shell.openPath(this.installDir);
  }

  async uninstall() {
    return execFile(this.uninstallerPath, () => {});
  }

  hide() {
    const mainWindow = MainWindow.getWindow();
    mainWindow.hide();
  }

  show() {
    const mainWindow = MainWindow.getWindow();
    mainWindow.show();
  }

  close() {
    const mainWindow = MainWindow.getWindow();
    mainWindow.close();
  }
}

const launcherManager = new LauncherManager();
launcherManager.init();
module.exports = launcherManager;
