/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Outil admin « hash d'un dossier » : même algorithme que le launcher (install/manifest).
 * Sert à l'onglet Tools et au script `build-manifest`.
 */

import fs from "fs";
import path from "path";

import { manifestHash, scanManifest, type Manifest } from "../install/manifest.js";

export interface FolderHash {
  /** Hash de l'entrée (`hash` du latest.yml). */
  hash: string;
  fileCount: number;
  totalBytes: number;
  manifest: Manifest;
}

const assertDirectory = (directory: string): void => {
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    throw new Error(`Dossier introuvable : ${directory}`);
  }
};

/** Manifeste + hash d'entrée d'un dossier (les motifs `ignore` correspondent au `to_ignore`). */
export const hashFolder = async (directory: string, ignore: readonly string[] = []): Promise<FolderHash> => {
  assertDirectory(directory);
  const manifest = await scanManifest(directory, ignore);
  const files = Object.keys(manifest);
  const totalBytes = files.reduce((sum, file) => sum + fs.statSync(path.join(directory, file)).size, 0);
  return { hash: manifestHash(manifest, ignore), fileCount: files.length, totalBytes, manifest };
};

/**
 * Écrit `<sortie>/hash.json` (`content` de l'entrée) et la copie des fichiers dans `<sortie>/hash/`
 * (`hash-folder` de l'entrée), prêts à être servis par le backend.
 */
export const exportHashFolder = async (
  directory: string,
  output: string,
  ignore: readonly string[] = [],
): Promise<FolderHash> => {
  const result = await hashFolder(directory, ignore);
  fs.rmSync(path.join(output, "hash"), { recursive: true, force: true });
  for (const file of Object.keys(result.manifest)) {
    const destination = path.join(output, "hash", file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(directory, file), destination);
  }
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, "hash.json"), JSON.stringify(result.manifest, null, 2));
  return result;
};

/**
 * Écrit seulement `<sortie>/hash.json` : pour un jeu commercial (`steam_library`), les fichiers ne sont
 * JAMAIS copiés ni hébergés, seul leur hash est publié.
 */
export const exportManifestOnly = async (
  directory: string,
  output: string,
  ignore: readonly string[] = [],
): Promise<FolderHash> => {
  const result = await hashFolder(directory, ignore);
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, "hash.json"), JSON.stringify(result.manifest, null, 2));
  return result;
};
