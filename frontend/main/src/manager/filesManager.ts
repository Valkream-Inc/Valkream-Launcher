/**
 * @author Valkream Team
 * @license MIT-NC
 */

const path = require("path");
const { platform } = require("os");

const DirsManager = require("./dirsManager.js");

class FilesManager {
  uninstallerPath = () => {
    const root = DirsManager.launcherRootPath();
    if (platform() === "win32") {
      return path.join(root, "Uninstall Valkream-Launcher.exe");
    }
    // Fallback pour Linux/macOS → script ou binaire générique
    return path.join(root, "uninstall.sh");
  };

  updaterDetailsPath = () =>
    path.join(DirsManager.rootPath(), "updater-details.flag");
}

module.exports = new FilesManager();
