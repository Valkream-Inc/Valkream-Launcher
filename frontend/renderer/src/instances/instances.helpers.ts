/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Fonctions pures du renderer pour le système d'instances (testées avec node:test).
 */

import type { Channel, EntryReport, InstanceSummary } from "@shared/types";

/** Canal à utiliser : beta seulement si le joueur l'a activée ET que l'instance en propose une. */
export const pickChannel = (
  betaEnabled: boolean,
  channels: readonly Channel[],
): Channel => (betaEnabled && channels.includes("beta") ? "beta" : "stable");

/** Une instance est affichable si le remote l'active et que le renderer sait la décrire. */
export const isSelectable = (
  summary: InstanceSummary,
  renderIds: readonly string[],
): boolean => summary.availability === "enabled" && renderIds.includes(summary.id);

export interface PathTable {
  /** Sous-chemin géré (une table Debug par sous-chemin). */
  path: string;
  entries: EntryReport[];
  /** Au moins une entrée de ce sous-chemin est en échec (hors entrées ignorées). */
  failing: boolean;
}

const isFailing = (entry: EntryReport): boolean =>
  !["up-to-date", "skipped"].includes(entry.status);

/** Regroupe les entrées par sous-chemin, dans l'ordre d'apparition. */
export const groupEntriesByPath = (entries: readonly EntryReport[]): PathTable[] => {
  const tables = new Map<string, PathTable>();
  for (const entry of entries) {
    const key = entry.path.replace(/^\/+|\/+$/g, "");
    let table = tables.get(key);
    if (!table) {
      table = { path: key, entries: [], failing: false };
      tables.set(key, table);
    }
    table.entries.push(entry);
    table.failing ||= isFailing(entry);
  }
  return [...tables.values()];
};

/**
 * Deux entrées dont l'un des chemins contient l'autre se partagent des fichiers
 * (ex : `game` et `game/BepInEx/plugins`). Signalé dans le Debug : ce n'est pas
 * une erreur, mais les `to_ignore` / `gameFolderToPreserve` doivent alors être précis.
 */
export const overlappingPaths = (entries: readonly EntryReport[]): [string, string][] => {
  const paths = [...new Set(entries.map((e) => e.path.replace(/^\/+|\/+$/g, "")))];
  const overlaps: [string, string][] = [];
  for (const a of paths) {
    for (const b of paths) {
      if (a !== b && b.startsWith(a + "/")) overlaps.push([a, b]);
    }
  }
  return overlaps;
};
