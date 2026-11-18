/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Opérations disque de l'installation : suppression qui respecte conservation
 * et exclusions, jamais en dehors du dossier de l'entrée.
 */

import fs from "fs";
import path from "path";

import { resolveInside } from "./paths";
import { canDeleteFile, type UpdatePlan } from "./preserve";

const toPosix = (value: string): string => value.split(path.sep).join("/");

/** Chemins relatifs (en `/`) de tous les fichiers sous `directory`. */
export const listFiles = (directory: string, base = directory): string[] => {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((item) => {
    const full = path.join(directory, item.name);
    return item.isDirectory()
      ? listFiles(full, base)
      : [toPosix(path.relative(base, full))];
  });
};

const removeEmptyDirectories = (directory: string, stopAt: string): void => {
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) return;
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    if (item.isDirectory()) removeEmptyDirectories(path.join(directory, item.name), stopAt);
  }
  if (directory !== stopAt && fs.readdirSync(directory).length === 0) fs.rmdirSync(directory);
};

/**
 * Supprime `relativePaths` (fichiers ou dossiers, relatifs à `entryDir`) en
 * épargnant ce que le plan conserve ou ignore. Retourne les fichiers supprimés.
 */
export const removeWithPlan = (
  entryDir: string,
  relativePaths: readonly string[],
  plan: UpdatePlan,
): string[] => {
  const removed: string[] = [];
  for (const relative of relativePaths) {
    const target = resolveInside(entryDir, relative); // lève si ça sort de l'entrée
    if (!fs.existsSync(target)) continue;

    const files = fs.statSync(target).isDirectory()
      ? listFiles(target, entryDir)
      : [toPosix(path.relative(entryDir, target))];

    for (const file of files) {
      if (!canDeleteFile(file, plan)) continue;
      fs.rmSync(path.join(entryDir, file), { force: true });
      removed.push(file);
    }
    if (fs.statSync(target, { throwIfNoEntry: false })?.isDirectory()) {
      removeEmptyDirectories(target, entryDir);
      if (fs.existsSync(target) && fs.readdirSync(target).length === 0) fs.rmdirSync(target);
    }
  }
  return removed;
};
