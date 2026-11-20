/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Contrat IPC : ce que le preload expose au renderer via `contextBridge`.
 * Le preload implémente ces interfaces, le renderer les consomme via `window`.
 */

import type { ActionResult } from "./common";
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
} from "./instance";
import type { SettingKey, Settings } from "./settings";

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
