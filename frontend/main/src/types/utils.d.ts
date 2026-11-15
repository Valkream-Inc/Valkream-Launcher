/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Types internes au process main pour les utilitaires
 * (téléchargement, décompression, rate limiter, base de données...).
 */

import type { GamePlatform, ProgressCallback } from "@shared/types";

/** Une valeur par plateforme, telle que reçue par `newDir`. */
export type PlatformValues = Record<GamePlatform, string>;

/** Retourne une promesse résolue quand une action peut démarrer. */
export type RateLimiter = () => Promise<void>;

/** Exécute une tâche asynchrone en respectant la limite de concurrence. */
export type LimitFunction = <T>(fn: () => Promise<T>) => Promise<T>;

/** Callback de progression d'un fichier : (octets traités, total, pourcentage, vitesse). */
export type FileProgressCallback = (
  processedBytes: number,
  totalBytes: number,
  percent: number,
  speed: number
) => void | Promise<void>;

/** Fichier à télécharger. */
export interface DownloadEntry {
  url: string;
  destPath: string;
}

/** Progression globale de `dowloadMultiplefiles`. */
export interface DownloadProgress {
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
  speed: number;
}

export type DownloadProgressCallback = (
  data: DownloadProgress
) => void | Promise<void>;

/** Archive zip à décompresser. */
export interface UnzipEntry {
  path: string;
  destPath: string;
}

/** Progression globale de `unZipMultipleFiles`. */
export interface UnzipProgress {
  percent: number;
  decompressedBytes: number;
  totalBytes: number;
  speed: number;
}

export type UnzipProgressCallback = (
  data: UnzipProgress
) => void | Promise<void>;

/** Progression de `copyFolder`. */
export interface CopyProgress {
  transferredBytes: number;
  totalBytes: number;
  percent: number;
  speed: number;
}

export type CopyProgressCallback = (data: CopyProgress) => void | Promise<void>;

/** Callback de progression de `hashFolderWithArborescence` (ou aucun). */
export type HashProgressCallback = ProgressCallback | null;

/** Erreur réseau Node/axios (champs optionnels utilisés pour la détection). */
export interface NetworkErrorLike {
  code?: string;
  message?: string;
  request?: unknown;
  response?: unknown;
}

/** Ligne brute de la table SQLite (`id`, `json_data`). */
export interface DatabaseRow {
  id: number;
  json_data: string;
}

/** Donnée JSON lue en base, enrichie de son identifiant. */
export type DatabaseRecord<T extends object> = T & { ID: number | bigint };
