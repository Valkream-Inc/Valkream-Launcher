/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Option `key` du latest.yml : quand `content` est un lien vers un fichier JSON, `key` désigne
 * l'endroit du fichier où se trouvent les données (ex : `dependencies.mods`).
 * Absent ou `.` : le fichier entier. Les segments numériques indexent un tableau (`packs.0.mods`).
 */

import { LocalizedError } from "./localized-error.js";

export const isValidKey = (key: string): boolean =>
  key === "." || key.split(".").every((segment) => segment !== "");

export const pickKey = <T = unknown>(value: unknown, key?: string): T => {
  if (key === undefined || key === "." || key === "") return value as T;
  let current: unknown = value;
  for (const segment of key.split(".")) {
    if (Array.isArray(current) && /^\d+$/.test(segment)) current = current[Number(segment)];
    else if (current !== null && typeof current === "object" && segment in (current as object)) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      throw new LocalizedError("err.keyNotFound", { key, segment });
    }
    if (current === undefined) throw new LocalizedError("err.keyNotFound", { key, segment });
  }
  return current as T;
};
