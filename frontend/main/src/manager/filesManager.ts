/**
 * @author Valkream Team
 * @license MIT-NC
 */

import path from "path";
import { platform } from "os";

import DirsManager from "./dirsManager";

class FilesManager {
  uninstallerPath = (): string => {
    const root = DirsManager.launcherRootPath();
    if (platform() === "win32") {
      return path.join(root, "Uninstall Valkream-Launcher.exe");
    }
    // Fallback pour Linux/macOS → script ou binaire générique
    return path.join(root, "uninstall.sh");
  };

  updaterDetailsPath = (): string =>
    path.join(DirsManager.rootPath(), "updater-details.flag");
}

export default new FilesManager();
