/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Manifeste de hash d'une entrée : `{ "chemin/relatif": sha256 }` des fichiers
 * qu'elle possède. Le hash de l'entrée est le sha256 de ce manifeste.
 * Les fichiers `to_ignore` en sont exclus (ils sont locaux au joueur).
 */

import { createHash } from "crypto";
import fs from "fs";
import path from "path";

import { listFiles } from "./fs-ops.js";
import { matchesAny, normalizeRelative } from "../../lib/patterns.js";

export type Manifest = Record<string, string>;

/** sha256 du manifeste, indépendant de l'ordre des clés et des `to_ignore`. */
export const manifestHash = (
  manifest: Manifest,
  toIgnore: readonly string[] = [],
): string => {
  const hash = createHash("sha256");
  Object.keys(manifest)
    .map(normalizeRelative)
    .filter((file) => !matchesAny(file, toIgnore))
    .sort()
    .forEach((file) => hash.update(`${file}\0${manifest[file]}\n`));
  return hash.digest("hex");
};

export const hashFile = (filePath: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    fs.createReadStream(filePath)
      .on("error", reject)
      .on("data", (chunk) => hash.update(chunk))
      .on("end", () => resolve(hash.digest("hex")));
  });

export interface ManifestDiff {
  missing: string[];
  changed: string[];
}

/**
 * Compare un manifeste attendu au disque. Les fichiers en plus ne sont pas signalés
 * (le joueur en possède d'autres) ; les `to_ignore` ne sont pas vérifiés.
 */
export const verifyManifest = async (
  directory: string,
  manifest: Manifest,
  toIgnore: readonly string[] = [],
  hasher: (filePath: string) => Promise<string> = hashFile,
): Promise<ManifestDiff> => {
  const diff: ManifestDiff = { missing: [], changed: [] };
  for (const [rawFile, expected] of Object.entries(manifest)) {
    const file = normalizeRelative(rawFile);
    if (matchesAny(file, toIgnore)) continue;
    const fullPath = path.join(directory, file);
    if (!fs.existsSync(fullPath)) diff.missing.push(file);
    else if ((await hasher(fullPath)) !== expected.toLowerCase()) diff.changed.push(file);
  }
  return diff;
};

/** Manifeste des fichiers de `directory` (hors `to_ignore`), prêt pour le backend. */
export const scanManifest = async (
  directory: string,
  toIgnore: readonly string[] = [],
): Promise<Manifest> => {
  const manifest: Manifest = {};
  for (const file of listFiles(directory).sort()) {
    if (matchesAny(file, toIgnore)) continue;
    manifest[file] = await hashFile(path.join(directory, file));
  }
  return manifest;
};
