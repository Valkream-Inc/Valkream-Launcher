/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Types du système d'instances : une instance = un jeu (ou une variante d'un jeu)
 * décrit par une config main, une config render et des fichiers remote.
 * Ce dossier ne contient QUE des types (fichiers .d.ts) : aucun code exécutable.
 */

import type { GamePlatform, ProgressData } from "./common";
import type { GameEvent, Maintenance } from "./infos";

import type { CheckInfosResult } from "./infos";

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
/* Remote : games/<id>/index.config.json (un par jeu)                 */
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

/**
 * `games/<id>/index.config.json` : tout ce que le remote déclare pour UN jeu.
 * Le lien vers ce fichier est dans la config main de l'instance (`indexUrl`) ;
 * les liens des `latest*.yml` (stable, beta) ne sont écrits qu'ici.
 */
export interface RemoteIndex {
  schemaVersion: 1;
  /** Doit être l'id de l'instance qui charge ce fichier. */
  id: InstanceId;
  /** Plateformes sur lesquelles l'instance est proposée (clés = `os.platform()`). */
  enabled: Partial<Record<GamePlatform, boolean>>;
  /** Liens vers les `latest*.yml` de chaque canal (un canal absent n'est pas proposé). */
  channels?: Partial<Record<Channel, string>>;
  /** Espace libre minimal (Mo) exigé avant une première installation du jeu. */
  requiredSpaceMb?: number;
  event?: LinkOrData<GameEvent>;
  maintenance?: LinkOrData<Maintenance>;
  contributors?: LinkOrData<Contributor[]>;
  mods?: LinkOrData<ModDisplay[]>;
}

/* ------------------------------------------------------------------ */
/* Remote : latest.yml (une entrée = un pattern)                      */
/* ------------------------------------------------------------------ */

/** Provider qui installe l'entrée. */
export type EntryType =
  | "zip_url"
  | "hash_url"
  | "thunderstore_modpack_url"
  | "steam_library"
  | "nexus_modpack_url";

/**
 * Niveau d'une entrée (les deux forcent la mise à jour : le jeu n'est jouable
 * en ligne que lorsque tout ce qui est actif est à jour) :
 * - `game-base` (X1) : le jeu lui-même, réinstallation complète si en retard ;
 * - `game-details` (X2) : mods, configs et autres détails, mise à jour incrémentale.
 */
export type ReleaseTier = "game-base" | "game-details";

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

/** Une valeur par plateforme (clé `default` pour les autres). */
export type PlatformTable<T> = Partial<Record<GamePlatform | "default", T>>;

/**
 * Valeur déclarée d'une option du latest.yml (toutes sauf `version`) :
 * - la donnée elle-même (inline) ;
 * - ou un lien (`https://…` ou `/chemin` relatif au serveur de fichiers) vers un
 *   fichier JSON / YAML qui la contient ;
 * - et chacune de ces deux formes peut être déclinée par plateforme.
 * Le dossier d'installation (`path`) n'est PAS une option du remote : il est décidé par la
 * config main, par nom d'entrée (le remote ne choisit jamais où le launcher écrit).
 * Les options qui sont elles-mêmes des liens (`content` d'un zip, `hash-folder`,
 * `api-url`) gardent leur lien tel quel : le provider s'en sert directement.
 */
export type RawOption<T> = T | string | PlatformTable<T | string>;

/** Entrée telle qu'écrite dans le latest.yml (avant choix de la plateforme et lecture des liens). */
export interface RawReleaseEntry {
  version: string | number;
  type: RawOption<EntryType>;
  /** sha256 du manifeste des fichiers que possède l'entrée. */
  hash?: RawOption<string>;
  content: EntryContentByPlatform;
  /**
   * `hash_url` et `thunderstore_modpack_url` : quand `content` est un lien vers un fichier JSON,
   * chemin pointé des données dans ce fichier (ex : `dependencies.mods`, `packs.0.list`).
   * Absent ou `.` : le fichier entier.
   */
  key?: RawOption<string>;
  /** `hash_url` : URL de base des fichiers du manifeste. */
  "hash-folder"?: RawOption<string>;
  /**
   * `hash_url` : archive de TOUS les fichiers du manifeste (mêmes chemins relatifs). Utilisée
   * à la place des téléchargements fichier par fichier quand la majorité des fichiers manque
   * (installation complète) : un seul téléchargement compressé ; chaque fichier est quand même
   * vérifié par son hash, et ceux qui manquent ou diffèrent sont repris un par un.
   */
  zip?: RawOption<string>;
  /** `zip_url` et `hash_url` (avec `zip`) : dossier de l'archive à extraire. */
  folder_in_zip?: RawOption<string>;
  /** `steam_library` : `buildid` Steam attendu (affiché si la version installée par le joueur est différente). */
  buildid?: RawOption<string | number>;
  /** `steam_library` : branche bêta Steam à choisir (affichée dans le mode d'emploi). */
  "steam-beta"?: RawOption<string>;
  /** `steam_library` : depot + manifeste pour télécharger la version exacte avec DepotDownloader. */
  depot?: RawOption<DepotOptions>;
  /** `thunderstore_modpack_url` et `nexus_modpack_url` : domaine de l'API. */
  "api-url"?: RawOption<string>;
  /** Relatifs à `path`. Supprimés à la mise à jour de l'entrée. */
  gameFolderToRemove?: RawOption<string[]>;
  /**
   * Fichiers ou dossiers (relatifs à `path`) conservés à la mise à jour de l'entrée :
   * ni écrasés ni supprimés (ex : config client). Une règle avec `from` ne conserve
   * que si la version installée la satisfait ; sinon la nouvelle version l'écrase.
   */
  gameFolderToPreserve?: RawOption<PreserveItem[]>;
  /**
   * Motifs (relatifs à `path`) exclus du hash, de la vérification et du nettoyage :
   * fichiers locaux que l'entrée ne possède pas (logs, caches, réglages joueur).
   */
  to_ignore?: RawOption<string[]>;
  /** Entrée installée seulement si ce réglage d'instance est actif. */
  optional?: RawOption<{ setting: string }>;
  /**
   * `thunderstore_modpack_url` : sa présence active la résolution des dépendances transitives
   * (le `manifest.json` de chaque mod liste les siennes). `skip` : dossiers `Auteur-Nom`
   * jamais installés comme dépendance (ex : le pack BepInEx, déjà fourni par le jeu).
   */
  dependencies?: RawOption<DependencyOptions>;
}

export interface DependencyOptions {
  skip?: string[];
}

/** Entrée résolue pour la plateforme courante : plus de table par plateforme, liens de données lus. */
export interface ReleaseEntry {
  version: string;
  /** Dossier d'installation, relatif à la racine de l'instance : vient de la config main. */
  path: string;
  type: EntryType;
  hash?: string;
  /** Lien, liste ou manifeste (jamais une table par plateforme). */
  content: EntryContent;
  key?: string;
  "hash-folder"?: string;
  zip?: string;
  folder_in_zip?: string;
  buildid?: string | number;
  "steam-beta"?: string;
  depot?: DepotOptions;
  "api-url"?: string;
  gameFolderToRemove?: string[];
  gameFolderToPreserve?: PreserveItem[];
  to_ignore?: string[];
  optional?: { setting: string };
  dependencies?: DependencyOptions;
}

export type ReleaseEntries = Record<string, ReleaseEntry>;

export interface ReleaseConfig {
  /** `X0.X1.X2` : affichage seulement. */
  version: string;
  buildDate?: string;
  "game-base"?: ReleaseEntries;
  "game-details"?: ReleaseEntries;
}

/** latest.yml tel qu'écrit sur le serveur. */
export interface RawReleaseConfig {
  version: string;
  buildDate?: string;
  "game-base"?: Record<string, RawReleaseEntry>;
  "game-details"?: Record<string, RawReleaseEntry>;
}

/* ------------------------------------------------------------------ */
/* Résumé exposé au renderer (`instances:list`)                       */
/* ------------------------------------------------------------------ */

export type InstanceAvailability =
  /** Index valide et instance activée pour cette plateforme. */
  | "enabled"
  /** Index valide mais instance désactivée pour cette plateforme. */
  | "disabled"
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

/** Valeur d'un réglage : interrupteur, choix / texte, ou nombre (curseur). */
export type InstanceSettingValue = boolean | string | number;

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
  optionalSetting?: string;
  /** Entrée optionnelle désactivée mais encore installée : la prochaine synchro la retire. */
  pendingRemoval?: boolean;
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
  /** Entrées actives pas à jour : le jeu n'est pas jouable en ligne tant qu'il en reste. */
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
  /** Nombre d'entrées enregistrées comme installées (connu même sans accès au remote). */
  installedCount: number;
  /** App Steam de l'instance : active le réglage `launchSteam` et le lien vers la page du jeu. */
  steamAppId?: number;
  /** Réglages propres à cette installation. */
  settings: Record<string, InstanceSettingValue>;
  executable?: { path: string; exists: boolean };
  /** Erreurs globales : index/latest injoignable ou invalide, canal absent… */
  errors: string[];
}

/* ------------------------------------------------------------------ */
/* Installation / mise à jour (`instances:sync`)                       */
/* ------------------------------------------------------------------ */

export interface InstanceSyncProgress {
  id: InstanceId;
  channel: Channel;
  /** Entrée en cours (absente pour les messages globaux). */
  entry?: string;
  /** Rang de l'entrée parmi celles à traiter. */
  index: number;
  total: number;
  step: "start" | "download" | "extract" | "verify" | "done" | "error";
  message?: string;
  /** Temps écoulé depuis le début de la synchronisation (ms). */
  elapsedMs: number;
  /** Progression du fichier en cours de téléchargement (valeurs formatées, ex : "12.3 Mo"). */
  transfer?: Pick<ProgressData, "processedBytes" | "totalBytes" | "percent" | "speed">;
}

/** `steam_library` : le jeu du joueur est absent ou d'une autre version → solutions proposées. */
export interface SteamSourceIssue {
  issue: "missing" | "version";
  /** Mode d'emploi Markdown. */
  guide: string;
  /** DepotDownloader est possible (l'entrée déclare `depot`). */
  depotAvailable: boolean;
}

export interface DepotInfo {
  /** Version épinglée de DepotDownloader (vide : non configuré). */
  version: string;
  toolsDir: string;
  downloadDir: string;
  sourceUrl: string;
}

export interface DepotOutput {
  id: InstanceId;
  channel: Channel;
  line?: string;
  percent?: number;
}

export interface DepotOptions {
  /** Identifiant du depot Steam. */
  id: number | string;
  /** Identifiant du manifeste du depot (la version exacte du jeu). */
  manifest: string | number;
}

export interface InstanceSyncResult {
  installed: string[];
  failed: { name: string; error: string; steamIssue?: SteamSourceIssue }[];
  /** Le jeu est-il jouable après cette synchronisation ? */
  works: boolean;
  /** L'utilisateur a annulé : les entrées restantes n'ont pas été traitées (ce n'est pas un échec). */
  cancelled?: boolean;
}

/* ------------------------------------------------------------------ */
/* Statut affiché sur l'accueil (`instances:status`)                    */
/* ------------------------------------------------------------------ */

export interface InstanceStatus {
  isInternetConnected: boolean;
  isServerReachable: boolean;
  /** Le jeu (entrées `game-base`) est installé. */
  isInstalled: boolean;
  /** Tout ce qui est actif est à jour. */
  isUpToDate: boolean;
  /** Une entrée `game-base` est en retard : réinstallation complète. */
  isMajorUpdate: boolean;
  /** Version affichée (`version` du latest.yml, à titre d'information). */
  gameVersion: string | null;
  /** Entrées optionnelles actives (ex : mods admin) : sert aux avertissements. */
  activeOptionalSettings: string[];
  /** Peut-on lancer le jeu maintenant ? */
  canPlay: boolean;
  /** Erreurs de configuration remote (affichées dans Debug). */
  errors: string[];
}

/** Infos serveur / événement / maintenance d'une instance (`instances:infos`). */
export interface InstanceInfos extends CheckInfosResult {}

/* ------------------------------------------------------------------ */
/* Outils admin                                                       */
/* ------------------------------------------------------------------ */

export interface ToolsHashSummary {
  folder: string;
  /** Hash d'entrée (`hash` du latest.yml). */
  hash: string;
  fileCount: number;
  totalBytes: number;
  /** `hash.json` : `{ "chemin/relatif": sha256 }`. */
  manifest: Record<string, string>;
}

export interface ModsListResult {
  mods: ModDisplay[];
  failed: { id: string; error: string }[];
}
