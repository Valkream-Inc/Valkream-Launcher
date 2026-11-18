/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Conservation des fichiers locaux d'une entrée lors d'une mise à jour. Module pur.
 *
 * `gameFolderToPreserve` : ce qui reste en place d'une version à l'autre.
 * Une règle avec `from` ne conserve que si la VERSION INSTALLÉE la satisfait
 * (la config du joueur est encore compatible) ; sinon le fichier est remplacé.
 */

import type { PreserveItem, ReleaseEntry } from "@shared/types";

import { matchesAny } from "./patterns";
import { versionSatisfies } from "./version";

/**
 * Motifs à conserver pour une mise à jour depuis `installedVersion`.
 * Première installation (`installedVersion` absente) : rien n'existe, rien à conserver.
 */
export const resolvePreserved = (
  items: readonly PreserveItem[] | undefined,
  installedVersion: string | undefined,
): string[] => {
  if (!items || installedVersion === undefined) return [];
  return items.flatMap((item) => {
    if (typeof item === "string") return [item];
    if (item.from === undefined) return [item.path];
    return versionSatisfies(installedVersion, item.from) ? [item.path] : [];
  });
};

export interface UpdatePlan {
  /** Motifs conservés pour cette mise à jour. */
  preserved: string[];
  /** Motifs ignorés (jamais touchés, jamais hashés). */
  ignored: string[];
}

export const planEntryUpdate = (
  entry: Pick<ReleaseEntry, "gameFolderToPreserve" | "to_ignore">,
  installedVersion: string | undefined,
): UpdatePlan => ({
  preserved: resolvePreserved(entry.gameFolderToPreserve, installedVersion),
  ignored: entry.to_ignore ?? [],
});

/**
 * Faut-il écrire ce fichier de la nouvelle version ?
 * - ignoré : jamais ;
 * - conservé et déjà présent : non (on garde celui du joueur) ;
 * - conservé mais absent : oui (la config par défaut est fournie).
 */
export const shouldWriteFile = (
  relativePath: string,
  plan: UpdatePlan,
  existsLocally: boolean,
): boolean => {
  if (matchesAny(relativePath, plan.ignored)) return false;
  if (existsLocally && matchesAny(relativePath, plan.preserved)) return false;
  return true;
};

/** Ce fichier local peut-il être supprimé par le nettoyage de l'entrée ? */
export const canDeleteFile = (relativePath: string, plan: UpdatePlan): boolean =>
  !matchesAny(relativePath, plan.preserved) &&
  !matchesAny(relativePath, plan.ignored);
