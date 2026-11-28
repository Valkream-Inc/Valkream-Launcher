/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Hash d'un fichier isolé, avec le même algorithme que le launcher :
 *  - un manifeste (`.json` de la forme `{ "chemin": sha256 }`) → hash du manifeste (`hash` d'une entrée hash_url),
 *    indépendant de l'indentation, de l'ordre des clés et des `to_ignore` ;
 *  - tout autre fichier (zip, tar.gz…) → sha256 des octets (`hash` d'une entrée zip_url).
 */

import fs from "fs";

import type { ToolsHashFileSummary } from "@shared/types";
import { hashFile, manifestHash, type Manifest } from "../install/state/manifest.js";

const SHA256 = /^[a-f0-9]{64}$/i;

/** Lit un manifeste (BOM toléré) ; `null` si le fichier n'en est pas un. */
export const readManifest = (text: string): Manifest | null => {
  try {
    const value: unknown = JSON.parse(text.replace(/^﻿/, ""));
    if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return null;
    return entries.every(([, hash]) => typeof hash === "string" && SHA256.test(hash)) ? (value as Manifest) : null;
  } catch {
    return null;
  }
};

export const hashAnyFile = async (file: string, toIgnore: readonly string[] = []): Promise<ToolsHashFileSummary> => {
  const size = fs.statSync(file).size;
  const manifest = file.toLowerCase().endsWith(".json") && size <= 64 * 1024 * 1024
    ? readManifest(fs.readFileSync(file, "utf8"))
    : null;
  if (manifest) {
    const files = Object.keys(manifest).length;
    return { file, kind: "manifest", hash: manifestHash(manifest, toIgnore), size, fileCount: files };
  }
  return { file, kind: "file", hash: await hashFile(file), size };
};
