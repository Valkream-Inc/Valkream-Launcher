/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Types internes au process main pour le système d'instances.
 */

import type { GamePlatform, InstanceId } from "@shared/types";

import type { ServerQueryConfig } from "./core";

/**
 * Config main d'une instance : ce que le remote n'a pas le droit de décider
 * (chemins autorisés, exécutable) et ce qui ne change qu'avec une release du launcher.
 */
export interface InstanceMainConfig {
  /** Clé commune aux trois couches (main, render, remote). */
  id: InstanceId;
  /** Serveur de jeu interrogé avec GameDig. */
  server: ServerQueryConfig;
  /** Lien vers `index.config.json` (`/chemin` relatif au serveur de fichiers, ou URL). */
  indexUrl: string;
  /** Repli du canal stable si l'index ne donne pas de lien `channels.stable`. */
  gameUrl?: string;
  /**
   * Liste blanche : un `path` d'entrée du `latest.yml` doit être l'un de ces
   * chemins (relatifs à la racine de l'instance) ou un de leurs sous-dossiers.
   */
  allowedPaths: string[];
  /** Exécutable du jeu, relatif à la racine de l'instance. */
  executable?: Partial<Record<GamePlatform, string>>;
  /** App Steam, pour le lancement via Steam. */
  steamAppId?: number;
}
