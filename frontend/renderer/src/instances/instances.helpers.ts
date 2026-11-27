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
 * Exception : un jeu sans canal stable propose sa `beta` même canaux de test désactivés
 * (sinon le jeu serait invisible tant qu'il n'est pas sorti en stable).
 */
export const selectableChannels = (
  channels: readonly Channel[],
  testChannelsEnabled: boolean,
): Channel[] => {
  const hasStable = channels.includes("stable");
  return [
    ...(hasStable ? (["stable"] as const) : []),
    ...TEST_CHANNELS.filter(
      (channel) =>
        channels.includes(channel) &&
        (testChannelsEnabled || (!hasStable && channel === "beta")),
    ),
  ];
};

/**
 * Canal souhaité s'il est encore proposé, sinon `null` : le joueur revient au choix du jeu
 * (canaux de test désactivés, canal retiré du remote, jeu sans canal stable).
 */
export const resolveChannel = (
  wanted: Channel,
  channels: readonly Channel[],
  testChannelsEnabled: boolean,
): Channel | null => (selectableChannels(channels, testChannelsEnabled).includes(wanted) ? wanted : null);

/**
 * Entrées du choix du jeu pour une instance : un canal par entrée. Un jeu dont aucun canal n'est proposé
 * (ex : seulement alpha, canaux de test désactivés, ou aucun canal déclaré) n'est pas affiché ; ses installations
 * apparaissent alors comme obsolètes. (Sans information du remote, l'instance n'est pas « enabled » : déjà masquée.)
 */
export const pickerChannels = (channels: readonly Channel[], testChannelsEnabled: boolean): Channel[] =>
  selectableChannels(channels, testChannelsEnabled);

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

export interface Page<T> {
  items: T[];
  /** Page affichée (1-based), ramenée dans les bornes. */
  page: number;
  pageCount: number;
}

/** Découpe une liste en pages (le rendu ne charge que la page affichée). */
export const paginate = <T,>(items: readonly T[], page: number, size: number): Page<T> => {
  const pageCount = Math.max(1, Math.ceil(items.length / Math.max(1, size)));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  return { items: items.slice((current - 1) * size, current * size), page: current, pageCount };
};
