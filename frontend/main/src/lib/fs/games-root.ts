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
import { LocalizedError } from "../errors/localized-error.js";

export const INSTANCES_DIR = "instances";

/** Déplacement en cours (état du processus : lancement / installation interdits pendant ce temps). */
export interface MoveProgress {
  active: boolean;
  done: number;
  total: number;
}
let moveProgress: MoveProgress = { active: false, done: 0, total: 0 };
export const getMoveProgress = (): MoveProgress => moveProgress;
export const isMovingGamesRoot = (): boolean => moveProgress.active;
const MOVING_SUFFIX = ".moving";

/** Contenu de `launcher-paths.json` : dossier choisi (absent = défaut) et « le joueur a validé son choix ». */
interface PathsFile {
  gamesRoot?: string;
  confirmed?: boolean;
}

const readPaths = (configFile: string): PathsFile => {
  try {
    const raw = JSON.parse(fs.readFileSync(configFile, "utf8")) as { gamesRoot?: unknown; confirmed?: unknown };
    return {
      gamesRoot: typeof raw.gamesRoot === "string" && path.isAbsolute(raw.gamesRoot) ? raw.gamesRoot : undefined,
      confirmed: raw.confirmed === true,
    };
  } catch {
    return {};
  }
};

const savePaths = (configFile: string, paths: PathsFile): void => {
  fs.mkdirSync(path.dirname(configFile), { recursive: true });
  const temporary = `${configFile}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(paths, null, 2));
  fs.renameSync(temporary, configFile);
};

export const readGamesRoot = (configFile: string): string | undefined => readPaths(configFile).gamesRoot;

/** Écriture atomique ; `undefined` = retour au dossier par défaut. Un choix explicite vaut validation. */
export const writeGamesRoot = (configFile: string, gamesRoot: string | undefined): void =>
  savePaths(configFile, { ...(gamesRoot ? { gamesRoot } : {}), confirmed: true });

/** Le joueur garde le dossier actuel (par défaut ou déjà choisi) : on ne le lui redemandera plus. */
export const confirmGamesRoot = (configFile: string): void =>
  savePaths(configFile, { ...readPaths(configFile), confirmed: true });

/** Des jeux sont déjà installés dans ce dossier (hors fichiers de déplacement). */
const hasGames = (root: string): boolean => {
  try {
    return fs.readdirSync(path.join(root, INSTANCES_DIR)).length > 0;
  } catch {
    return false;
  }
};

/**
 * Le choix du dossier est demandé au premier lancement seulement : tant que le joueur n'a rien validé
 * ET qu'aucun jeu n'est déjà installé (une installation existante est reprise telle quelle).
 */
export const needsGamesRootChoice = (configFile: string, defaultRoot: string): boolean => {
  const paths = readPaths(configFile);
  if (paths.confirmed) return false;
  return !hasGames(paths.gamesRoot ?? defaultRoot);
};

/** Espace libre (octets) du volume qui contiendra ce dossier, même s'il n'existe pas encore. */
export const freeSpaceBytes = (folder: string): number | undefined => {
  let current = path.resolve(folder);
  for (;;) {
    try {
      const stats = fs.statfsSync(current);
      return Number(stats.bavail) * Number(stats.bsize);
    } catch {
      const parent = path.dirname(current);
      if (parent === current) return undefined;
      current = parent;
    }
  }
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
  /** Progression (fichiers copiés / total) ; appelée à chaque changement d'état. */
  onProgress?: (progress: MoveProgress) => void;
}

const countFiles = async (dir: string): Promise<number> => {
  let count = 0;
  for (const entry of await fs.promises.readdir(dir, { withFileTypes: true })) {
    count += entry.isDirectory() ? await countFiles(path.join(dir, entry.name)) : 1;
  }
  return count;
};

/** Copie récursive fichier par fichier (progression), liens symboliques conservés. */
const copyTree = async (from: string, to: string, onFile: () => void): Promise<void> => {
  await fs.promises.mkdir(to, { recursive: true });
  for (const entry of await fs.promises.readdir(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) await copyTree(source, target, onFile);
    else if (entry.isSymbolicLink()) {
      await fs.promises.symlink(await fs.promises.readlink(source), target);
      onFile();
    } else {
      await fs.promises.copyFile(source, target);
      onFile();
    }
  }
};

export const moveGamesRoot = async (options: MoveOptions): Promise<void> => {
  if (moveProgress.active) throw new LocalizedError("err.rootMoving");
  const publish = (progress: MoveProgress) => {
    moveProgress = progress;
    options.onProgress?.(progress);
  };
  publish({ active: true, done: 0, total: 0 });
  try {
    await moveGamesRootNow(options, publish);
  } finally {
    publish({ active: false, done: 0, total: 0 });
  }
};

const moveGamesRootNow = async (
  { fromRoot, toRoot, configFile, isBusy, record }: MoveOptions,
  publish: (progress: MoveProgress) => void,
): Promise<void> => {
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
  const targetHasGames = fs.existsSync(target) && !isEmptyDir(target);
  if (targetHasGames && fs.existsSync(source)) throw new LocalizedError("err.rootNotEmpty", { target });

  fs.mkdirSync(to, { recursive: true });
  const moving = target + MOVING_SUFFIX;
  fs.rmSync(moving, { recursive: true, force: true });

  if (!fs.existsSync(source)) {
    // Rien à déplacer (aucun jeu installé, ou jeux déjà présents dans la destination) : seule la config change
    writeGamesRoot(configFile, record ?? to);
    return;
  }

  fs.rmSync(target, { recursive: true, force: true }); // vide ou absent
  try {
    fs.renameSync(source, target); // atomique sur un même volume
  } catch (error) {
    // EXDEV : autre volume. EPERM / EBUSY / EACCES : Windows (OneDrive, antivirus, fichier ouvert) refuse le rename
    if (!["EXDEV", "EPERM", "EBUSY", "EACCES"].includes((error as NodeJS.ErrnoException).code ?? "")) throw error;
    // Copie complète : copie complète à côté, puis bascule par rename (jamais de dossier à moitié rempli en place)
    try {
      const total = await countFiles(source);
      let done = 0;
      publish({ active: true, done, total });
      await copyTree(source, moving, () => publish({ active: true, done: ++done, total }));
      fs.renameSync(moving, target);
    } catch (copyError) {
      fs.rmSync(moving, { recursive: true, force: true });
      throw copyError;
    }
    writeGamesRoot(configFile, record ?? to);
    try {
      fs.rmSync(source, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch {
      // Déplacement réussi : un reste impossible à supprimer (verrou) n'est pas une erreur
    }
    return;
  }
  writeGamesRoot(configFile, record ?? to);
};
