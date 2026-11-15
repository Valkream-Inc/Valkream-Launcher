/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { PerPlatform } from "./common";

/** Contenu de `games/SevenDtoD/latest/latest.yml` (et de la copie locale). */
export interface SevenDtoDVersionConfig {
  version: string;
  buildDate?: string;
  modpack?: {
    version: string;
    hashs_url: string;
    download_url: string;
  };
  sevendtod?: { version: string; download_url: PerPlatform<string> };
}

/** `chemin relatif du fichier -> hash sha256`. */
export type SevenDtoDHashMap = Record<string, string>;

export type SevenDtoDModFileStatus =
  | "MODIFIED"
  | "DELETED"
  | "NEW"
  | "MOVED"
  | "UNCHANGED";

/** Ligne du tableau de synchronisation des mods. */
export interface SevenDtoDModFileDiff {
  status: SevenDtoDModFileStatus;
  oldPath: string | null;
  newPath: string | null;
  hashLocal: string | null;
  hashOnline: string | null;
}

export interface SevenDtoDInstallationStatut {
  isServerReachable: boolean;
  isInternetConnected: boolean;
  isInstalled: boolean;
  isUpToDate: boolean;
  isMajorUpdate: boolean;
  gameVersion: string | null | undefined;
}
