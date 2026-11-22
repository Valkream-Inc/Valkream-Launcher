/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Types internes au process main pour les utilitaires
 * (téléchargement, base de données, dossiers...).
 */

import type { GamePlatform } from "@shared/types";

/** Une valeur par plateforme, telle que reçue par `newDir`. */
export type PlatformValues = Record<GamePlatform, string>;

/** Callback de progression d'un fichier : (octets traités, total, pourcentage, vitesse). */
export type FileProgressCallback = (
  processedBytes: number,
  totalBytes: number,
  percent: number,
  speed: number
) => void | Promise<void>;

/** Erreur réseau Node / fetch (champs optionnels utilisés pour la détection). */
export interface NetworkErrorLike {
  code?: string;
  name?: string;
  message?: string;
  /** `fetch` place le code système (ECONNRESET…) dans `cause`. */
  cause?: { code?: string };
}
