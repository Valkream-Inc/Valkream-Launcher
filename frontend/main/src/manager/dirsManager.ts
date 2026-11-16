/**
 * @author Valkream Team
 * @license MIT-NC
 */

import path from "path";
import { app } from "electron";
import newDir from "../utils/new-dir";

import isDev from "../constants/isDev";

class DirsManager {
  launcherRootPath = (): string => process.cwd();
  appDataPath = (): string => app.getPath("appData");

  launcherAppDataPath = (): string =>
    newDir({
      win32: path.join(this.appDataPath(), "Valkream-Launcher"),
      linux: path.join(this.appDataPath(), "Valkream-Launcher"),
      darwin: path.join(this.appDataPath(), "Valkream-Launcher"),
    });

  rootPath = (): string =>
    newDir(
      isDev
        ? {
            win32: path.join(this.launcherRootPath(), "data"),
            linux: path.join(this.launcherRootPath(), "data"),
            darwin: path.join(this.launcherRootPath(), "data"),
          }
        : {
            win32: path.join(
              this.launcherRootPath(),
              "../valkream-launcher-data"
            ),
            linux: path.join(
              this.launcherRootPath(),
              "../valkream-launcher-data"
            ),
            darwin: path.join(
              this.launcherRootPath(),
              "../valkream-launcher-data"
            ),
          }
    );

  dbPath = (): string => (isDev ? this.rootPath() : this.launcherAppDataPath());
}

export default new DirsManager();
