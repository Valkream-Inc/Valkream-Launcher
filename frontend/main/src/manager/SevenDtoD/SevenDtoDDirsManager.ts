/**
 * @author Valkream Team
 * @license MIT-NC
 */

import path from "path";
import newDir from "../../utils/new-dir";

import DirsManager from "../dirsManager";

class SevenDtoDDirsManager {
  rootPath = (): string => DirsManager.rootPath();

  gameRootPath = (): string =>
    newDir({
      win32: path.join(this.rootPath(), "game/SevenDtoDGame"),
      linux: path.join(this.rootPath(), "game/SevenDtoDGame"),
      darwin: path.join(this.rootPath(), "game/SevenDtoDGame"),
    });

  gamePath = (): string =>
    newDir({
      win32: path.join(this.gameRootPath(), "SevenDtoD"),
      linux: path.join(this.gameRootPath(), "SevenDtoD"),
      darwin: path.join(this.gameRootPath(), "SevenDtoD"),
    });

  // mods
  modsPath = (): string =>
    newDir({
      win32: path.join(this.gamePath(), "Mods"),
      linux: path.join(this.gamePath(), "Mods"),
      darwin: path.join(this.gamePath(), "Mods"),
    });

  modsFixPath = (): string => path.join(this.gameRootPath(), "ModsFix");
  modsFixFilesPath = (): string => path.join(this.modsFixPath(), "files");
}

export default new SevenDtoDDirsManager();
