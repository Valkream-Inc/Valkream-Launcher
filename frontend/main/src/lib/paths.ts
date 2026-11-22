/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Chemins d'une instance : racine locale et confinement.
 * Module pur (aucun import Electron) pour rester testable.
 */

import path from "path";

import type { Channel, InstanceId } from "@shared/types";
import { LocalizedError } from "./localized-error.js";

/**
 * `target` est-il `root` ou un descendant de `root` ?
 * Compare via `path.relative` : `/data/game2` n'est PAS dans `/data/game`
 * (un simple `startsWith` l'acceptait).
 */
export const isPathInside = (root: string, target: string): boolean => {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative === "") return true;
  // Autre lecteur sous Windows : path.relative renvoie alors un chemin absolu.
  if (path.isAbsolute(relative)) return false;
  return relative !== ".." && !relative.startsWith(".." + path.sep);
};

/**
 * Résout un chemin relatif (un `/` ou `\` initial est ignoré) sous `root`.
 * Lève si le résultat sort de `root`.
 */
export const resolveInside = (root: string, relativePath: string): string => {
  const cleaned = relativePath.replace(/^[/\\]+/, "");
  const fullPath = path.resolve(root, cleaned);
  if (!isPathInside(root, fullPath)) {
    throw new LocalizedError("err.pathOutside", { path: relativePath });
  }
  return fullPath;
};

/** Segment de dossier sûr (un id d'instance devient un nom de dossier). */
export const isSafeSegment = (segment: string): boolean =>
  /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(segment) && !segment.includes("..");

/**
 * Chemin relatif sûr : pas absolu, pas de lecteur, pas de segment `..`.
 * Un `/` initial est toléré (convention des `latest.yml` : `/BepInEx/config`).
 */
export const isSafeRelativePath = (value: string): boolean => {
  if (typeof value !== "string" || value.trim() === "") return false;
  if (value.includes("\0")) return false;
  if (/^[A-Za-z]:/.test(value)) return false; // lecteur Windows
  if (value.startsWith("//") || value.startsWith("\\\\")) return false; // UNC
  const segments = value.replace(/\\/g, "/").replace(/^\/+/, "").split("/");
  return !segments.includes("..");
};

/** `<rootPath>/instances/<id>/<canal>` : stable et beta ne partagent aucun fichier. */
export const instanceRootPath = (
  rootPath: string,
  instanceId: InstanceId,
  channel: Channel,
): string => {
  if (!isSafeSegment(instanceId)) {
    throw new LocalizedError("err.invalidInstanceId", { id: instanceId });
  }
  return path.join(rootPath, "instances", instanceId, channel);
};
