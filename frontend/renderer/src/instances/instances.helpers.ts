/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Fonctions pures du renderer pour le système d'instances (testées avec node:test).
 */

import type { Channel, EntryReport, InstanceSummary } from "@shared/types";

/** Canaux de test, du plus stable au plus instable (ordre d'affichage). */
export const TEST_CHANNELS = ["beta", "alpha"] as const satisfies readonly Channel[];

/** Couleur d'accent de chaque canal de test (bordure, pastille) dans le choix du jeu. */
export const CHANNEL_COLOR: Record<Exclude<Channel, "stable">, string> = {
  beta: "#ffb300",
  alpha: "#ff5252",
};

/**
 * Canaux proposés dans le choix du jeu : `stable` toujours (s'il existe), les canaux de test
 * seulement si le joueur les a activés ET que le remote les propose.
 */
export const selectableChannels = (
  channels: readonly Channel[],
  testChannelsEnabled: boolean,
): Channel[] => [
  ...(channels.includes("stable") ? (["stable"] as const) : []),
  ...(testChannelsEnabled ? TEST_CHANNELS.filter((channel) => channels.includes(channel)) : []),
];

/** Canal souhaité s'il est encore proposé, sinon `stable` (ex : beta retirée du remote ou désactivée). */
export const resolveChannel = (
  wanted: Channel,
  channels: readonly Channel[],
  testChannelsEnabled: boolean,
): Channel => (selectableChannels(channels, testChannelsEnabled).includes(wanted) ? wanted : "stable");

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
