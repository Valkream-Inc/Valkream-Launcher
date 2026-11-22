/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Cache des hash de fichiers d'une installation (`instance.hashes.json`).
 * Un fichier n'est relu et re-hashé que si sa taille ou sa date de modification
 * ont changé : la vérification d'une installation complète devient quasi instantanée.
 * Le cache ne fait jamais foi à lui seul : toute différence de taille / date = nouveau hash.
 */

import fs from "fs";
import path from "path";

import { hashFile } from "./manifest.js";

const HASH_CACHE_FILE = "instance.hashes.json";

interface CachedHash {
  size: number;
  mtimeMs: number;
  hash: string;
}

interface HashCacheFile {
  schemaVersion: 1;
  files: Record<string, CachedHash>;
}

const isCachedHash = (value: unknown): value is CachedHash => {
  const entry = value as Partial<CachedHash> | null;
  return (
    entry !== null &&
    typeof entry === "object" &&
    typeof entry.size === "number" &&
    typeof entry.mtimeMs === "number" &&
    typeof entry.hash === "string"
  );
};

export class HashCache {
  private readonly file: string;
  private files: Record<string, CachedHash> = {};
  private dirty = false;

  constructor(private readonly installDir: string) {
    this.file = path.join(installDir, HASH_CACHE_FILE);
    try {
      const raw = JSON.parse(fs.readFileSync(this.file, "utf8")) as Partial<HashCacheFile>;
      for (const [key, value] of Object.entries(raw.files ?? {})) {
        if (isCachedHash(value)) this.files[key] = value;
      }
    } catch {
      // absent ou illisible : cache vide
    }
  }

  private keyOf(filePath: string): string {
    return path.relative(this.installDir, filePath).split(path.sep).join("/");
  }

  /** sha256 du fichier ; `fresh` ignore le cache (réparation : on relit vraiment le disque). */
  async hash(filePath: string, { fresh = false }: { fresh?: boolean } = {}): Promise<string> {
    const { size, mtimeMs } = fs.statSync(filePath);
    const key = this.keyOf(filePath);
    const cached = this.files[key];
    if (!fresh && cached && cached.size === size && cached.mtimeMs === mtimeMs) return cached.hash;

    const hash = await hashFile(filePath);
    this.files[key] = { size, mtimeMs, hash };
    this.dirty = true;
    return hash;
  }

  /** Enregistre le hash d'un fichier qu'on vient d'écrire et de vérifier. */
  remember(filePath: string, hash: string): void {
    const { size, mtimeMs } = fs.statSync(filePath);
    this.files[this.keyOf(filePath)] = { size, mtimeMs, hash };
    this.dirty = true;
  }

  /** Oublie les fichiers du cache qui n'existent plus. */
  prune(): void {
    for (const key of Object.keys(this.files)) {
      if (!fs.existsSync(path.join(this.installDir, key))) {
        delete this.files[key];
        this.dirty = true;
      }
    }
  }

  /** Écriture atomique, seulement si quelque chose a changé. */
  save(): void {
    if (!this.dirty) return;
    try {
      fs.mkdirSync(this.installDir, { recursive: true });
      const temporary = `${this.file}.tmp`;
      const data: HashCacheFile = { schemaVersion: 1, files: this.files };
      fs.writeFileSync(temporary, JSON.stringify(data));
      fs.renameSync(temporary, this.file);
      this.dirty = false;
    } catch {
      // le cache est une optimisation : ne jamais faire échouer l'installation
    }
  }
}
