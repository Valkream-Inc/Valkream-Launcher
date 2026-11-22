/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Dossier d'installation des jeux modifiable (réglage général) et déplacement atomique.
 * Les jeux sont dans `<racine>/instances/`. Déplacer = `rename` (atomique, même volume) ;
 * sinon copie complète dans `instances.moving`, puis `rename` final, puis ancien dossier supprimé.
 * La configuration n'est modifiée qu'APRÈS un déplacement réussi : en cas d'échec ou d'arrêt brutal,
 * l'ancien emplacement reste valide et les restes sont nettoyés au démarrage suivant.
 * Module sans dépendance Electron.
 */

import fs from "fs";
import path from "path";

import { isPathInside } from "./paths.js";
import { LocalizedError } from "./localized-error.js";

export const INSTANCES_DIR = "instances";
const MOVING_SUFFIX = ".moving";

export const readGamesRoot = (configFile: string): string | undefined => {
  try {
    const raw = JSON.parse(fs.readFileSync(configFile, "utf8")) as { gamesRoot?: unknown };
    return typeof raw.gamesRoot === "string" && path.isAbsolute(raw.gamesRoot) ? raw.gamesRoot : undefined;
  } catch {
    return undefined;
  }
};

/** Écriture atomique ; `undefined` = retour au dossier par défaut. */
export const writeGamesRoot = (configFile: string, gamesRoot: string | undefined): void => {
  fs.mkdirSync(path.dirname(configFile), { recursive: true });
  const temporary = `${configFile}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(gamesRoot ? { gamesRoot } : {}, null, 2));
  fs.renameSync(temporary, configFile);
};

const isEmptyDir = (dir: string): boolean => fs.readdirSync(dir).length === 0;

/** Retire les restes d'un déplacement interrompu. */
export const cleanupInterruptedMove = (root: string): void => {
  fs.rmSync(path.join(root, INSTANCES_DIR + MOVING_SUFFIX), { recursive: true, force: true });
};

export interface MoveOptions {
  fromRoot: string;
  toRoot: string;
  configFile: string;
  /** Écriture d'un déplacement refusée tant qu'une installation tourne. */
  isBusy?: () => boolean;
  /** Valeur enregistrée dans la config (`undefined` : retour au défaut). */
  record?: string | undefined;
}

export const moveGamesRoot = async ({ fromRoot, toRoot, configFile, isBusy, record }: MoveOptions): Promise<void> => {
  const from = path.resolve(fromRoot);
  const to = path.resolve(toRoot);
  if (!path.isAbsolute(toRoot)) throw new LocalizedError("err.rootAbsolute");
  if (from === to) throw new LocalizedError("err.rootSame");
  if (isPathInside(from, to) || isPathInside(to, from)) {
    throw new LocalizedError("err.rootNested");
  }
  if (isBusy?.()) throw new LocalizedError("err.rootBusy");

  const source = path.join(from, INSTANCES_DIR);
  const target = path.join(to, INSTANCES_DIR);
  if (fs.existsSync(target) && !isEmptyDir(target)) throw new LocalizedError("err.rootNotEmpty", { target });

  fs.mkdirSync(to, { recursive: true });
  const moving = target + MOVING_SUFFIX;
  fs.rmSync(moving, { recursive: true, force: true });

  if (!fs.existsSync(source)) {
    // Rien à déplacer (aucun jeu installé) : seule la config change
    writeGamesRoot(configFile, record ?? to);
    return;
  }

  fs.rmSync(target, { recursive: true, force: true }); // vide ou absent
  try {
    fs.renameSync(source, target); // atomique sur un même volume
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EXDEV") throw error;
    // Autre volume : copie complète à côté, puis bascule par rename (jamais de dossier à moitié rempli en place)
    try {
      await fs.promises.cp(source, moving, { recursive: true });
      fs.renameSync(moving, target);
    } catch (copyError) {
      fs.rmSync(moving, { recursive: true, force: true });
      throw copyError;
    }
    writeGamesRoot(configFile, record ?? to);
    fs.rmSync(source, { recursive: true, force: true });
    return;
  }
  writeGamesRoot(configFile, record ?? to);
};
