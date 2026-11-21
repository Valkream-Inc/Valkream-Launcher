/**
 * @author Valkream Team
 * @license MIT-NC
 */

import path from "path";
import { app } from "electron";
import { readGamesRoot } from "../lib/games-root";
import newDir from "../lib/platform-dir";

import { isDev } from "./constants";

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

  /** Config des chemins (dossier des jeux) et version du launcher : dans les données du launcher. */
  pathsFile = (): string => path.join(this.dbPath(), "launcher-paths.json");
  versionFile = (): string => path.join(this.dbPath(), "launcher-version.json");

  /** Dossier contenant `instances/` : réglage du joueur, sinon le dossier de données par défaut. */
  gamesRoot = (): string => readGamesRoot(this.pathsFile()) ?? this.rootPath();

  dbPath = (): string => (isDev ? this.rootPath() : this.launcherAppDataPath());
}

export default new DirsManager();
