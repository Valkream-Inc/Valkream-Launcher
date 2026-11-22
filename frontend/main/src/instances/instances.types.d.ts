/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Types internes au process main pour le système d'instances.
 */

import type { GamePlatform, InstanceId, InstanceSettingValue, RawOption } from "@shared/types";

import type { ServerQueryConfig } from "../types/core.js";
import type { LaunchArgs } from "./local/launch-args.js";

/**
 * Config main d'une instance : ce que le remote n'a pas le droit de décider
 * (chemins d'installation, exécutable) et ce qui ne change qu'avec une release du launcher.
 */
export interface InstanceMainConfig {
  /** Clé commune aux trois couches (main, render, remote). */
  id: InstanceId;
  /** Serveur de jeu interrogé avec GameDig. */
  server: ServerQueryConfig;
  /** Lien vers `games/<id>/index.config.json` (`/chemin` relatif au serveur de fichiers, ou URL). */
  indexUrl: string;
  /**
   * Dossier d'installation de chaque entrée du `latest.yml`, par NOM d'entrée, relatif à
   * la racine de l'instance. Le remote ne choisit jamais où le launcher écrit : une entrée
   * absente d'ici est refusée. Une valeur peut être déclinée par plateforme
   * (`{ win32: "game", default: "game-linux" }`) ; sans valeur pour la plateforme,
   * l'entrée n'est pas proposée.
   */
  entryPaths: Record<string, RawOption<string>>;
  /** Exécutable du jeu, relatif à la racine de l'instance. */
  executable?: Partial<Record<GamePlatform, string>>;
  /**
   * Commande du PATH lancée à la place de `executable` (ex : `java` pour un jeu Java),
   * par plateforme. Le fichier du jeu se passe alors dans `launchArgs` (`-jar`, …).
   */
  command?: Partial<Record<GamePlatform, string>>;
  /** Dossier de lancement, relatif à la racine de l'instance (défaut : dossier de l'exécutable, ou la racine avec `command`). */
  launchCwd?: string;
  /**
   * Arguments passés à l'exécutable, éventuellement selon les réglages (voir `local/launch-args.ts`) :
   * `["-Xmx{ram}M", { when: "fullscreen", args: ["--fullscreen"] }]`.
   */
  launchArgs?: LaunchArgs;
  /**
   * App Steam. Sa présence active le réglage `launchSteam` (démarrer Steam avant le jeu, pour la
   * vérification de possession) et le lien vers la page du jeu dans les réglages.
   */
  steamAppId?: number;
  /** Valeurs des réglages tant que le joueur n'en a pas choisi une (`launchSteam`, `launcherBehavior`…). */
  defaultSettings?: Readonly<Record<string, InstanceSettingValue>>;
}
