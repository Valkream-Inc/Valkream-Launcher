/**
 * @author Valkream Team
 * @license MIT-NC
 */

import fs from "fs";
import path from "path";
import { platform } from "os";

import DirsManager from "./dirs.js";

class FilesManager {
  uninstallerPath = (): string => {
    const root = DirsManager.launcherRootPath();
    if (platform() === "win32") {
      // Nom donné par electron-builder : « Uninstall <productName>.exe ». Les installations faites avant le
      // changement de productName (« Valkream-Launcher ») gardent l'ancien nom.
      const names = ["Uninstall Valkream Launcher.exe", "Uninstall Valkream-Launcher.exe"];
      const found = names.find((name) => fs.existsSync(path.join(root, name)));
      return path.join(root, found ?? names[0]);
    }
    // Fallback pour Linux/macOS → script ou binaire générique
    return path.join(root, "uninstall.sh");
  };

  updaterDetailsPath = (): string =>
    path.join(DirsManager.rootPath(), "updater-details.flag");
}

export default new FilesManager();
