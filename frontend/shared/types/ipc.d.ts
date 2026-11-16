/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Contrat IPC : ce que le preload expose au renderer via `contextBridge`.
 * Le preload implémente ces interfaces, le renderer les consomme via `window`.
 */

import type { ActionResult, ErrorData, GameName, ProgressData } from "./common";
import type { CheckInfosResult } from "./infos";
import type { SettingKey, Settings } from "./settings";
import type {
  SevenDtoDInstallationStatut,
  SevenDtoDModFileDiff,
} from "./sevendtod";
import type {
  ValheimBaseMod,
  ValheimHashData,
  ValheimInstallationStatut,
  ValheimModDetails,
  ValheimModsData,
} from "./valheim";

export type Listener<T> = (data: T) => void;

/** Cycle de vie commun d'une action longue (install, update, play...). */
export interface ActionEvents {
  onProgress(callback: Listener<ProgressData>): void;
  onDone(callback: Listener<unknown>): void;
  onError(callback: Listener<ErrorData>): void;
  removeListeners(): void;
}

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
  getInfos(game: GameName): Promise<CheckInfosResult>;

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

/** API commune aux jeux (la partie spécifique est ajoutée par jeu). */
interface BaseGameAPI {
  getInstallationStatut(): Promise<unknown>;
  openGameFolder(): Promise<string>;
  uninstallGame(): Promise<void>;

  install(): Promise<ActionResult>;
  onInstallProgress(callback: Listener<ProgressData>): void;
  onInstallDone(callback: Listener<unknown>): void;
  onInstallError(callback: Listener<ErrorData>): void;
  removeInstallListeners(): void;

  update(): Promise<ActionResult>;
  onUpdateProgress(callback: Listener<ProgressData>): void;
  onUpdateDone(callback: Listener<unknown>): void;
  onUpdateError(callback: Listener<ErrorData>): void;
  removeUpdateListeners(): void;
}

/** `window.electron_Valheim_API`. */
export interface ElectronValheimAPI extends BaseGameAPI {
  versionGame(): Promise<string>;
  getInstallationStatut(): Promise<ValheimInstallationStatut>;

  getModsData(signal?: AbortSignal): Promise<ValheimModsData | undefined>;
  getModDetails(baseMod: ValheimBaseMod): Promise<ValheimModDetails>;
  getHashData(): Promise<ValheimHashData>;

  start(): Promise<ActionResult>;

  customMods(): Promise<ActionResult>;
  onCustomModsProgress(callback: Listener<ProgressData>): void;
  onCustomModsDone(callback: Listener<unknown>): void;
  onCustomModsError(callback: Listener<ErrorData>): void;
  removeCustomModsListeners(): void;
}

/** `window.electron_SevenDtoD_API`. */
export interface ElectronSevenDtoDAPI extends BaseGameAPI {
  getInstallationStatut(): Promise<SevenDtoDInstallationStatut>;

  getModsData(): Promise<SevenDtoDModFileDiff[]>;
  onModsDataProgress(callback: Listener<ProgressData>): void;
  removeModsDataListeners(): void;
  /** JSON formaté (`JSON.stringify(hash, null, 2)`). */
  getLocalHashData(): Promise<string>;

  play(): Promise<ActionResult>;
  onPlayProgress(callback: Listener<ProgressData>): void;
  onPlayDone(callback: Listener<unknown>): void;
  onPlayError(callback: Listener<ErrorData>): void;
  removePlayListeners(): void;

  fixMods(): Promise<ActionResult>;
  onFixModsProgress(callback: Listener<ProgressData>): void;
  onFixModsDone(callback: Listener<unknown>): void;
  onFixModsError(callback: Listener<ErrorData>): void;
  removeFixModsListeners(): void;
}
