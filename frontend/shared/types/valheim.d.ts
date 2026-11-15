/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { PerPlatform } from "./common";

/** Contenu de `games/Valheim/latest/latest.yml` (et de la copie locale). */
export interface ValheimVersionConfig {
  /** Version du launcher/modpack au format X1.X2.X3.X4. */
  version: string;
  buildDate?: string;
  modpack?: {
    version: string;
    download_url?: string;
    admin_mods?: string[];
    boostfps_mods?: string[];
    boostgraphic_mods?: string[];
    dependencies?: string[];
    gameFolderToRemove?: string[];
    gameFolderToPreserve?: string[];
    hash?: { config?: string; plugins?: string };
  };
  valheim?: { version: string; download_url: PerPlatform<string> };
  bepinex?: { version: string; download_url: PerPlatform<string> };
}

/** Hashs retournés par `ValheimVersionManager.getHash()`. */
export interface ValheimHashData {
  localPluginsHash: string;
  localConfigHash: string;
  onlinePluginsHash?: string;
  onlineConfigHash?: string;
}

export type ValheimModType = "special" | "admin" | "normal";

/** Entrée de la liste des mods (avant chargement des détails). */
export interface ValheimBaseMod {
  /** Format `Auteur-Nom-Version` (Thunderstore). */
  mod: string;
  installed: boolean;
  type: ValheimModType;
  onlineVersion?: string;
}

export interface ValheimModsData {
  mods: ValheimBaseMod[];
}

export interface ValheimModDetails {
  name: string;
  localVersion?: string | null;
  onlineVersion?: string;
  LastBuild?: string;
  description?: string;
  icon?: string | null;
  type?: ValheimModType;
  installed?: boolean;
  error?: boolean;
}

export interface ValheimInstallationStatut {
  isInternetConnected: boolean;
  isServerReachable: boolean;
  isInstalled: boolean;
  isUpToDate: boolean;
  isMajorUpdate: boolean;
  gameVersion: string | null | undefined;
  isAdminModsActive: boolean;
  isCustomModsToInstall: boolean;
  isCustomModsToUninstall: boolean;
}
