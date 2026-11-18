/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Types du système d'instances : une instance = un jeu (ou une variante d'un jeu)
 * décrit par une config main, une config render et des fichiers remote.
 * Ce dossier ne contient QUE des types (fichiers .d.ts) : aucun code exécutable.
 */

import type { GamePlatform } from "./common";
import type { GameEvent, Maintenance } from "./infos";

/** Clé commune aux trois couches (main, render, remote). Ex : `Valheim-Valkream-v2`. */
export type InstanceId = string;

export type Channel = "stable" | "beta";

/** Identité d'une installation locale : une instance dans un canal. */
export type InstanceKey = `${InstanceId}@${Channel}`;

/**
 * Valeur d'un paramètre remote :
 * - une chaîne = un lien (`https://…` ou `/chemin/relatif` au serveur de fichiers) ;
 * - tout autre type = la donnée elle-même (inline).
 */
export type LinkOrData<T> = string | T;

/* ------------------------------------------------------------------ */
/* Remote : index.config.json                                         */
/* ------------------------------------------------------------------ */

/** Contributeur affiché dans l'onglet Mods (`contributor.config.json`). */
export interface Contributor {
  name: string;
  avatar?: string;
  role?: string;
  link?: string;
}

/** Mod affiché dans l'onglet Mods (`mods.config.json`) : affichage seulement. */
export interface ModDisplay {
  /** Permet au Debug de relier l'affichage à ce qui est réellement installé. */
  id?: string;
  name: string;
  icon?: string;
  description?: string;
  link?: string;
}

export interface RemoteIndexEntry {
  id: InstanceId;
  /** Plateformes sur lesquelles l'instance est proposée (clés = `os.platform()`). */
  enabled: Partial<Record<GamePlatform, boolean>>;
  /** Liens vers les `latest*.yml` de chaque canal. */
  channels?: Partial<Record<Channel, string>>;
  event?: LinkOrData<GameEvent>;
  maintenance?: LinkOrData<Maintenance>;
  contributors?: LinkOrData<Contributor[]>;
  mods?: LinkOrData<ModDisplay[]>;
}

export interface RemoteIndex {
  schemaVersion: 1;
  instances: RemoteIndexEntry[];
}

/* ------------------------------------------------------------------ */
/* Remote : latest.yml (une entrée = un pattern)                      */
/* ------------------------------------------------------------------ */

/** Provider qui installe l'entrée. */
export type EntryType =
  | "zip_url"
  | "hash_url"
  | "thunderstore_modpack_url"
  | "nexus_modpack_url";

/**
 * Niveau d'impact d'une entrée.
 * - `game-base` (X1) : réinstallation complète, jeu bloqué tant que non à jour ;
 * - `game-breaking` (X2) : compatibilité serveur, jeu bloqué tant que non à jour ;
 * - `game-notbreaking` (X3) : on peut jouer sans la mise à jour.
 */
export type ReleaseTier = "game-base" | "game-breaking" | "game-notbreaking";

/** Contenu d'une entrée : lien, liste (mods) ou objet inline (manifeste de hash). */
export type EntryContent = string | string[] | Record<string, unknown>;

/** Contenu unique, ou une valeur par plateforme (clé `default` pour les autres). */
export type EntryContentByPlatform =
  | EntryContent
  | Partial<Record<GamePlatform | "default", EntryContent>>;

/**
 * Règle de conservation. Une chaîne = toujours conservé.
 * `from` = versions de l'entrée installée pour lesquelles le fichier reste compatible
 * (ex : `>=1.2.0`, `>=1.0.0 <2.0.0`, `1.x`, `*`).
 */
export type PreserveItem = string | PreserveRule;

export interface PreserveRule {
  path: string;
  from?: string;
}

export interface ReleaseEntry {
  version: string;
  /** Relatif à la racine de l'instance, ne sort jamais de celle-ci. */
  path: string;
  type: EntryType;
  /** sha256 du manifeste des fichiers que possède l'entrée. */
  hash?: string;
  content: EntryContentByPlatform;
  /** `hash_url` : URL de base des fichiers du manifeste. */
  "hash-folder"?: string;
  /** `zip_url` : dossier de l'archive à extraire. */
  folder_in_zip?: string;
  /** `thunderstore_modpack_url` et `nexus_modpack_url` : domaine de l'API. */
  "api-url"?: string;
  /** Relatifs à `path`. Supprimés à la mise à jour de l'entrée. */
  gameFolderToRemove?: string[];
  /**
   * Fichiers ou dossiers (relatifs à `path`) conservés à la mise à jour de l'entrée :
   * ni écrasés ni supprimés (ex : config client). Une règle avec `from` ne conserve
   * que si la version installée la satisfait ; sinon la nouvelle version l'écrase.
   */
  gameFolderToPreserve?: PreserveItem[];
  /**
   * Motifs (relatifs à `path`) exclus du hash, de la vérification et du nettoyage :
   * fichiers locaux que l'entrée ne possède pas (logs, caches, réglages joueur).
   */
  to_ignore?: string[];
  /** Entrée installée seulement si ce réglage d'instance est actif. */
  optional?: { setting: string };
}

export type ReleaseEntries = Record<string, ReleaseEntry>;

export interface ReleaseConfig {
  /** `X0.X1.X2.X3` : affichage seulement. */
  version: string;
  buildDate?: string;
  "game-base"?: ReleaseEntries;
  "game-breaking"?: ReleaseEntries;
  "game-notbreaking"?: ReleaseEntries;
}

/* ------------------------------------------------------------------ */
/* Résumé exposé au renderer (`instances:list`)                       */
/* ------------------------------------------------------------------ */

export type InstanceAvailability =
  /** Dans l'index et activée pour cette plateforme. */
  | "enabled"
  /** Dans l'index mais désactivée pour cette plateforme. */
  | "disabled"
  /** Absente de l'index remote. */
  | "not-in-index"
  /** Index injoignable et aucune copie locale. */
  | "unreachable"
  /** Index reçu mais invalide. */
  | "invalid";

export interface InstanceSummary {
  id: InstanceId;
  availability: InstanceAvailability;
  channels: Channel[];
  /** D'où vient l'index utilisé. */
  indexSource: "online" | "cache" | "none";
  errors: string[];
}

/* ------------------------------------------------------------------ */
/* Rapport d'une installation (`instances:report`) : onglets Mods/Debug */
/* ------------------------------------------------------------------ */

export type InstanceSettingValue = boolean | string;

export type EntryStatus =
  /** Version et hash installés = ceux du remote. */
  | "up-to-date"
  | "outdated"
  | "not-installed"
  /** Fichiers possédés modifiés ou manquants (vérification approfondie). */
  | "modified"
  /** Entrée `optional` dont le réglage est désactivé. */
  | "skipped"
  | "invalid";

export interface EntryReport {
  name: string;
  tier: ReleaseTier;
  type: EntryType | string;
  /** Sous-chemin géré par l'entrée (relatif à la racine d'installation). */
  path: string;
  declaredVersion: string;
  installedVersion?: string;
  declaredHash?: string;
  installedHash?: string;
  status: EntryStatus;
  /** Bloque le jeu tant que non à jour (game-base, game-breaking). */
  blocking: boolean;
  optionalSetting?: string;
  /** Motifs réellement conservés pour une mise à jour depuis la version installée. */
  preserved: string[];
  toIgnore: string[];
  /** Vérification approfondie (hash_url) : fichiers en écart. */
  files?: { missing: string[]; changed: string[] };
  errors: string[];
}

export interface InstanceReportSummary {
  total: number;
  upToDate: number;
  outdated: number;
  notInstalled: number;
  modified: number;
  skipped: number;
  invalid: number;
  /** Entrées bloquantes pas à jour. */
  blocking: string[];
  /** Le jeu est-il jouable en l'état ? (rien d'invalide ni de bloquant) */
  works: boolean;
}

export interface InstanceReport {
  id: InstanceId;
  channel: Channel;
  /** Racine locale de cette installation (stable et beta n'en partagent aucune). */
  installDir: string;
  releaseSource: "online" | "cache" | "none";
  releaseVersion?: string;
  entries: EntryReport[];
  summary: InstanceReportSummary;
  /** Mods et contributeurs affichés dans l'onglet Mods (config remote de l'instance). */
  mods: ModDisplay[];
  contributors: Contributor[];
  /** Réglages propres à cette installation. */
  settings: Record<string, InstanceSettingValue>;
  executable?: { path: string; exists: boolean };
  /** Erreurs globales : index/latest injoignable ou invalide, canal absent… */
  errors: string[];
}
