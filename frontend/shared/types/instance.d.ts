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
  /** Relatifs à `path`. */
  gameFolderToRemove?: string[];
  gameFolderToPreserve?: string[];
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
