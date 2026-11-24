/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Valeur d'`index.config.json` déclinable par canal (`event`, `maintenance`, `mods`, `contributors`) :
 *
 *   "event": "/games/x/config/event.json"                        ← une valeur pour tous les canaux
 *   "event": { "stable": "/…/event.json", "beta": "/…/beta.json" } ← une valeur par canal
 *
 * Un canal absent retombe sur `default`, puis sur `stable`. Une table par canal est un objet
 * dont TOUTES les clés sont des canaux (ou `default`) : les données (événement, liste) n'en sont pas.
 */

import type { Channel } from "@shared/types";

export const CHANNEL_KEYS: readonly string[] = ["stable", "beta", "alpha", "default"];

export const isChannelTable = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((key) => CHANNEL_KEYS.includes(key));
};

/** Valeur applicable au canal (hors table : la valeur elle-même, `undefined` si le canal n'a rien). */
export const pickChannel = <T>(value: T | Record<string, T> | undefined, channel: Channel): T | undefined => {
  if (!isChannelTable(value)) return value as T | undefined;
  const table = value as Record<string, T>;
  return table[channel] ?? table.default ?? table.stable;
};
