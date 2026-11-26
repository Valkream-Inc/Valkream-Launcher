/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Suppression d'un dossier avec progression (fichiers supprimés / total). Asynchrone : la fenêtre
 * ne se fige pas pendant la suppression d'un jeu de plusieurs milliers de fichiers.
 */

import fs from "fs";
import path from "path";

export interface RemoveProgress {
  /** Éléments supprimés. */
  done: number;
  /** Éléments à supprimer (fichiers et dossiers). */
  total: number;
}

/** Tous les chemins sous `dir` (fichiers et dossiers), les parents avant les enfants. Les liens ne sont pas suivis. */
const listTree = async (dir: string): Promise<string[]> => {
  const all: string[] = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      all.push(full);
      if (entry.isDirectory()) stack.push(full);
    }
  }
  return all;
};

/**
 * Supprime `dir` et tout son contenu. `onProgress` est appelé au départ (total connu), puis régulièrement.
 * Un dossier absent n'est pas une erreur.
 */
export const removeTreeWithProgress = async (
  dir: string,
  onProgress: (progress: RemoveProgress) => void = () => {},
): Promise<void> => {
  if (!fs.existsSync(dir)) {
    onProgress({ done: 0, total: 0 });
    return;
  }
  const entries = await listTree(dir);
  const total = entries.length + 1; // + le dossier racine
  let done = 0;
  onProgress({ done, total });
  // Enfants d'abord : on parcourt la liste à l'envers (un dossier est listé avant son contenu).
  for (let index = entries.length - 1; index >= 0; index--) {
    await fs.promises.rm(entries[index], { recursive: true, force: true });
    done++;
    if (done % 25 === 0) {
      onProgress({ done, total });
      await new Promise<void>((resolve) => setImmediate(resolve)); // laisse respirer le process
    }
  }
  await fs.promises.rm(dir, { recursive: true, force: true });
  onProgress({ done: total, total });
};
