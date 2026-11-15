/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Types communs au process main, au preload et au renderer.
 * Ce dossier ne contient QUE des types (fichiers .d.ts) : aucun code exécutable.
 */

/** Jeux gérés par le launcher. */
export type GameName = "Valheim" | "SevenDtoD";

/** Plateformes pour lesquelles un build de jeu peut être téléchargé. */
export type GamePlatform = "win32" | "linux" | "darwin";

/** Une valeur par plateforme (ex : url de téléchargement). */
export type PerPlatform<T> = Record<GamePlatform, T>;

/** Progression envoyée par le main au renderer pendant une action longue. */
export interface ProgressData {
  text: string;
  /** Valeurs déjà formatées par `formatBytes` (ex : "12.3 Mo"). */
  processedBytes: string;
  totalBytes: string;
  percent: number;
  speed: string;
}

/** Erreur envoyée par le main au renderer. */
export interface ErrorData {
  message: string;
}

/** Résultat standard d'une action IPC. */
export interface ActionResult {
  success: boolean;
  output?: string;
}

/** Callback de progression utilisé par les managers (avant formatage). */
export type ProgressCallback = (
  text: string,
  processedBytes: number,
  totalBytes: number,
  percent: number,
  speed: number
) => void;
