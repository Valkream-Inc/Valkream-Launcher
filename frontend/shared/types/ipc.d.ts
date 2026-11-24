/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Contrat IPC : ce que le preload expose au renderer via `contextBridge`.
 * Le preload implémente ces interfaces, le renderer les consomme via `window`.
 */

import type { ActionResult } from "./common.js";
import type {
  Channel,
  InstanceId,
  InstanceInfos,
  InstanceReport,
  InstanceSettingValue,
  InstanceStatus,
  InstanceSummary,
  InstanceSyncProgress,
  InstanceSyncResult,
  DepotOutput,
  DepotInfo,
  ModsApi,
  ModsListResult,
  ToolsHashSummary,
  ToolsProgress,
} from "./instance.js";
import type { SettingKey, Settings } from "./settings.js";

export type Listener<T> = (data: T) => void;

/** `window.electron_API` (fenêtre principale). */
export interface ElectronAPI {
  // general
  close(): void;

  // main window
  minimize(): void;
  maximize(): void;
  isMaximized(): Promise<boolean>;
  onMaximize(callback: () => void): void;
  onUnmaximize(callback: () => void): void;
  removeOnMaximize(callback: () => void): void;
  removeOnUnmaximize(callback: () => void): void;

  // infos
  versionLauncher(): Promise<string>;

  // jeux : une seule API pour toutes les instances (`id` = Valheim-Valkream-v2, SevenDtoD-Valkream-v2…)
  getInstances(): Promise<InstanceSummary[]>;
  /** Serveur de jeu, événement et maintenance. */
  getInstanceInfos(id: InstanceId): Promise<InstanceInfos>;
  /** Statut d'accueil : installé ? à jour ? jouable ? */
  getInstanceStatus(id: InstanceId, channel: Channel): Promise<InstanceStatus>;
  /** Rapport détaillé (onglets Mods et Debug). `verify` contrôle aussi les fichiers sur le disque. */
  getInstanceReport(
    id: InstanceId,
    channel: Channel,
    options?: { verify?: boolean }
  ): Promise<InstanceReport>;
  /** Installe / met à jour. `repair` retélécharge aussi les fichiers modifiés ou manquants. */
  syncInstance(
    id: InstanceId,
    channel: Channel,
    options?: { repair?: boolean }
  ): Promise<InstanceSyncResult>;
  /** Solution « localiser l'installation » : choisit le dossier du jeu. Retourne le dossier, `null` si annulé. */
  pickInstanceSource(id: InstanceId, channel: Channel): Promise<string | null>;
  /** Oublie le dossier de jeu choisi (retour à la bibliothèque Steam). */
  clearInstanceSource(id: InstanceId, channel: Channel): Promise<void>;
  /** Solution « DepotDownloader » : télécharge la version exacte (connexion par QR code). Retourne le dossier. */
  depotDownloadInstance(id: InstanceId, channel: Channel): Promise<string>;
  /** Informations de l'écran affiché avant la première utilisation de DepotDownloader. */
  getDepotInfo(id: InstanceId, channel: Channel): Promise<DepotInfo>;
  cancelDepotDownload(id: InstanceId, channel: Channel): Promise<void>;
  /** Sortie de DepotDownloader (lignes, dont le QR code) et progression. */
  onDepotOutput(callback: (data: DepotOutput) => void): void;
  removeDepotOutputListeners(): void;
  // outils admin (onglet Tools) : les dossiers sont choisis par boîte de dialogue côté main
  /** Choisit un dossier puis le hashe (même algorithme que le launcher). `null` si annulé. */
  toolsHashFolder(ignore: string[]): Promise<ToolsHashSummary | null>;
  /** Écrit `hash.json` + `hash/` du dernier dossier hashé dans un dossier choisi. `null` si annulé. */
  toolsExportHash(ignore: string[]): Promise<{ output: string } | null>;
  /** Liste `Auteur-Nom-Version` (texte, JSON ou lien) → mods avec image, description et lien. `key` : chemin du tableau dans un JSON (ex : `dependencies`). Un lien de page Thunderstore donne le mod (+ ses dépendances si `withDependencies`, défaut oui). */
  toolsModsList(source: string, api?: ModsApi, key?: string, withDependencies?: boolean): Promise<ModsListResult>;
  /** Choisit un fichier de liste (txt / json / md, 1 Mo max) et renvoie son texte. `null` si annulé. */
  toolsOpenTextFile(): Promise<{ name: string; text: string } | null>;
  /** Progression de l'outil en cours (hash d'un dossier, liste de mods). */
  onToolsProgress(callback: (data: ToolsProgress) => void): void;
  removeToolsProgressListeners(): void;
  /** Enregistre un texte via « Enregistrer sous ». Retourne le chemin, `null` si annulé. */
  toolsSaveText(defaultName: string, text: string): Promise<string | null>;
  /** Journal d'installation du canal (texte). */
  getInstanceLog(id: InstanceId, channel: Channel): Promise<string>;
  /** Annule la synchronisation en cours de ce canal (sans effet s'il n'y en a pas). */
  cancelInstanceSync(id: InstanceId, channel: Channel): Promise<void>;
  launchInstance(id: InstanceId, channel: Channel): Promise<void>;
  openInstanceFolder(id: InstanceId, channel: Channel): Promise<void>;
  uninstallInstance(id: InstanceId, channel: Channel): Promise<void>;
  onInstanceProgress(callback: Listener<InstanceSyncProgress>): void;
  removeInstanceProgressListeners(): void;
  setInstanceSetting(
    id: InstanceId,
    channel: Channel,
    name: string,
    value: InstanceSettingValue
  ): Promise<Record<string, InstanceSettingValue>>;

  // utils
  openLink(url: string): Promise<void>;
  getSettings<K extends SettingKey>(key: K): Promise<Settings[K]>;
  setSettings<K extends SettingKey>(key: K, value: Settings[K]): Promise<boolean>;
  openDevTools(): Promise<void>;
  openAppData(): Promise<string>;
  uninstallLauncher(): Promise<ActionResult>;
  /** Dossier d'installation des jeux (réglage général). */
  /** Dossier des jeux, espace libre du volume, et `needsChoice` : premier lancement, choix à demander. */
  getGamesRoot(): Promise<GamesRootInfo>;
  /** Garde le dossier proposé (le choix n'est plus redemandé). */
  confirmGamesRoot(): Promise<void>;
  /** Déplacement du dossier des jeux en cours (fichiers copiés / total). */
  getGamesRootMove(): Promise<GamesRootMove>;
  onGamesRootProgress(callback: (progress: GamesRootMove) => void): void;
  removeGamesRootProgressListeners(): void;
  /** Choisit un nouveau dossier et y déplace les jeux (atomique). `null` si annulé. */
  changeGamesRoot(): Promise<string | null>;
  resetGamesRoot(): Promise<string>;
  chooseFolder(): Promise<string | null>;
}

/** `window.electron_API` (fenêtre de mise à jour). */
export interface ElectronUpdaterAPI {
  checkForUpdates(): void;
  onUpdateStatus(callback: Listener<string>): void;
  onLaunchMainWindow(callback: () => void): void;
  removeUpdateListeners(): void;
  closeUpdateWindow(): void;
  openMainWindow(): void;
}

export interface GamesRootInfo {
  path: string;
  isDefault: boolean;
  freeBytes: number | null;
  needsChoice: boolean;
}

export interface GamesRootMove {
  active: boolean;
  done: number;
  total: number;
}
