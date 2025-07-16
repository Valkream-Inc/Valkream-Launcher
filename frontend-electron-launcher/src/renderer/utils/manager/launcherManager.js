const { execFile } = require("child_process");
const { ipcRenderer, shell } = require("electron");
const fs = require("fs");
const path = require("path");

const pkg = require(window.PathsManager.getAbsolutePath("package.json"));
const Manager = require("./manager.js");
const { showSnackbar } = require(window.PathsManager.getUtils());
class LauncherManager {
  async init() {
    this.installDir = path.join(
      await ipcRenderer.invoke("get-installation-path")
    );
  }

  getVersion() {
    if (pkg && pkg.version) return pkg.version;
    else return "0.0.0";
  }

  async openInstallationFolder() {
    return new Manager().handleError({
      ensure: fs.existsSync(this.installDir),
      then: async () => await shell.openPath(this.installDir),
    });
  }

  async uninstall() {
    const uninstallerPath = path.join(
      this.installDir,
      "Uninstall Valkream-Launcher.exe"
    );

    return new Manager().handleError({
      ensure: fs.existsSync(uninstallerPath),
      then: () => execFile(uninstallerPath, () => {}),
    });
  }
}

const launcherManager = new LauncherManager();
launcherManager.init();
module.exports = launcherManager;
