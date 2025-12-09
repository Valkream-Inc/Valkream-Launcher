/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const path = require("path");
const { app } = require("electron");
const newDir = require("../utils/new-dir.js");

const isDev = require("../constants/isDev.js");

class DirsManager {
  launcherRootPath = () => process.cwd();
  appDataPath = () => app.getPath("appData");

  launcherAppDataPath = () =>
    newDir({
      win32: path.join(this.appDataPath(), "Valkream-Launcher"),
      linux: path.join(this.appDataPath(), "Valkream-Launcher"),
      darwin: path.join(this.appDataPath(), "Valkream-Launcher"),
    });

  rootPath = () =>
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

  dbPath = () => (isDev ? this.rootPath() : this.launcherAppDataPath());
}

module.exports = new DirsManager();
