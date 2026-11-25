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

import { copyFileWithProgress } from "./copy-progress.js";
import { isPathInside } from "./paths.js";
import { LocalizedError } from "../errors/localized-error.js";

export const INSTANCES_DIR = "instances";

/** Déplacement en cours (état du processus : lancement / installation interdits pendant ce temps). */
export interface MoveProgress {
  active: boolean;
  /** Octets copiés. */
  done: number;
  /** Octets à copier. */
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
  /** Anciens dossiers de jeux dont la suppression a échoué (retentée au démarrage). */
  pendingRemoval?: string[];
}

const readPaths = (configFile: string): PathsFile => {
  try {
    const raw = JSON.parse(fs.readFileSync(configFile, "utf8")) as { gamesRoot?: unknown; confirmed?: unknown; pendingRemoval?: unknown };
    const pending = Array.isArray(raw.pendingRemoval)
      ? raw.pendingRemoval.filter((item): item is string => typeof item === "string" && path.isAbsolute(item))
      : [];
    return {
      gamesRoot: typeof raw.gamesRoot === "string" && path.isAbsolute(raw.gamesRoot) ? raw.gamesRoot : undefined,
      confirmed: raw.confirmed === true,
      ...(pending.length > 0 ? { pendingRemoval: pending } : {}),
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
export const writeGamesRoot = (configFile: string, gamesRoot: string | undefined): void => {
  const { pendingRemoval } = readPaths(configFile);
  savePaths(configFile, { ...(gamesRoot ? { gamesRoot } : {}), confirmed: true, ...(pendingRemoval ? { pendingRemoval } : {}) });
};

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
  /** Progression en octets (copiés / total) ; appelée à chaque changement d'état. */
  onProgress?: (progress: MoveProgress) => void;
}

/** Taille totale (octets) d'un dossier : sert de base à la progression de la copie. */
const folderBytes = async (dir: string): Promise<number> => {
  let bytes = 0;
  for (const entry of await fs.promises.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) bytes += await folderBytes(full);
    else if (!entry.isSymbolicLink()) bytes += (await fs.promises.stat(full)).size;
  }
  return bytes;
};

/** Copie récursive (progression en octets), liens symboliques conservés. */
const copyTree = async (from: string, to: string, onBytes: (bytes: number) => void): Promise<void> => {
  await fs.promises.mkdir(to, { recursive: true });
  for (const entry of await fs.promises.readdir(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) await copyTree(source, target, onBytes);
    else if (entry.isSymbolicLink()) await fs.promises.symlink(await fs.promises.readlink(source), target);
    else await copyFileWithProgress(source, target, onBytes);
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
    removeOldRoot(from, configFile);
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
      const total = await folderBytes(source);
      let done = 0;
      publish({ active: true, done, total });
      await copyTree(source, moving, (bytes) => publish({ active: true, done: (done += bytes), total }));
      fs.renameSync(moving, target);
    } catch (copyError) {
      fs.rmSync(moving, { recursive: true, force: true });
      throw copyError;
    }
    writeGamesRoot(configFile, record ?? to);
    removeOldRoot(from, configFile);
    return;
  }
  writeGamesRoot(configFile, record ?? to);
  removeOldRoot(from, configFile);
};

/**
 * Ancien emplacement après un déplacement réussi : `instances/` de l'ancien dossier supprimé, puis le dossier
 * lui-même s'il est vide (jamais un dossier qui contient autre chose). Un reste verrouillé (antivirus, fichier
 * ouvert) n'est pas une erreur : il est retenté au prochain démarrage (`cleanupPendingRemovals`).
 */
const removeOldRoot = (root: string, configFile: string): void => {
  try {
    fs.rmSync(path.join(root, INSTANCES_DIR), { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    if (fs.existsSync(root) && isEmptyDir(root)) fs.rmdirSync(root);
  } catch {
    const paths = readPaths(configFile);
    savePaths(configFile, { ...paths, pendingRemoval: [...new Set([...(paths.pendingRemoval ?? []), root])] });
  }
};

/** Retente la suppression des anciens dossiers de jeux restés verrouillés lors d'un déplacement. */
export const cleanupPendingRemovals = (configFile: string): void => {
  const paths = readPaths(configFile);
  if (!paths.pendingRemoval?.length) return;
  const current = paths.gamesRoot ? path.resolve(paths.gamesRoot) : undefined;
  const stillPending: string[] = [];
  for (const root of paths.pendingRemoval) {
    // Jamais le dossier actuellement utilisé (le joueur a pu revenir dessus entre-temps)
    if (current !== undefined && (path.resolve(root) === current || isPathInside(root, current))) continue;
    try {
      fs.rmSync(path.join(root, INSTANCES_DIR), { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      if (fs.existsSync(root) && isEmptyDir(root)) fs.rmdirSync(root);
    } catch {
      stillPending.push(root);
    }
  }
  savePaths(configFile, { ...readPaths(configFile), pendingRemoval: stillPending });
};
