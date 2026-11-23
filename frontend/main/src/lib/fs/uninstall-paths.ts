/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Dossier des jeux hors du dossier de données par défaut : le désinstalleur NSIS (`installer.nsh`) ne peut pas
 * lire les réglages du launcher. L'application lui laisse donc la liste des dossiers `instances` à supprimer
 * lors d'une désinstallation COMPLÈTE (jamais lors d'une mise à jour), dans `uninstall-paths.txt`.
 * Par sécurité, chaque dossier listé porte un fichier repère : le désinstalleur ne supprime que ce qu'il
 * peut reconnaître comme un dossier de jeux du launcher.
 * Module sans dépendance Electron.
 */

import fs from "fs";
import path from "path";

import { INSTANCES_DIR } from "./games-root.js";

/** Fichier repère posé dans chaque dossier `instances` listé (lu par `installer.nsh`). */
export const GAMES_MARKER = ".valkream-games";
/** Nom du fichier de liste, dans le dossier de données par défaut (lu par `installer.nsh`). */
export const UNINSTALL_PATHS_FILE = "uninstall-paths.txt";

/**
 * Met à jour la liste : vide (fichier supprimé) quand les jeux sont dans le dossier par défaut
 * (supprimé en entier par le désinstalleur), sinon `<dossier des jeux>/instances`.
 */
export const syncUninstallPaths = (options: { file: string; gamesRoot: string; defaultRoot: string }): string[] => {
  const { file, gamesRoot, defaultRoot } = options;
  const dirs: string[] = [];
  if (path.resolve(gamesRoot) !== path.resolve(defaultRoot)) {
    const instances = path.join(path.resolve(gamesRoot), INSTANCES_DIR);
    fs.mkdirSync(instances, { recursive: true });
    fs.writeFileSync(path.join(instances, GAMES_MARKER), "Dossier des jeux du Valkream-Launcher (supprimé à la désinstallation complète)\n");
    dirs.push(instances);
  }

  if (dirs.length === 0) {
    fs.rmSync(file, { force: true });
    return dirs;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, `${dirs.join("\r\n")}\r\n`);
  fs.renameSync(temporary, file);
  return dirs;
};
