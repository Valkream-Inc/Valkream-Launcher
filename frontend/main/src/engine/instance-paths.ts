/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Chemins d'une installation, tous dérivés de la config main de l'instance.
 * Module pur côté Electron (le chemin racine est injecté).
 */

import path from "path";

import type { Channel, GamePlatform } from "@shared/types";

import type { InstanceMainConfig } from "../types/instances";
import { instanceRootPath, isPathAllowed, resolveInside } from "./paths";

export interface InstallLocations {
  /** `<racine>/instances/<id>/<canal>` */
  installDir: string;
  /** Exécutable du jeu pour la plateforme, si la config en déclare un. */
  executable?: string;
}

export const installLocations = (
  rootPath: string,
  config: Pick<InstanceMainConfig, "id" | "executable">,
  channel: Channel,
  platform: GamePlatform,
): InstallLocations => {
  const installDir = instanceRootPath(rootPath, config.id, channel);
  const relative = config.executable?.[platform];
  return {
    installDir,
    executable: relative ? resolveInside(installDir, relative) : undefined,
  };
};

/**
 * Dossier d'une entrée, après contrôle par la liste blanche `allowedPaths`.
 * Lève si le `path` n'est pas autorisé ou sort de l'installation.
 */
export const entryDirectory = (
  installDir: string,
  entryPath: string,
  allowedPaths: readonly string[],
): string => {
  if (!isPathAllowed(entryPath, allowedPaths)) {
    throw new Error(`Chemin non autorisé pour cette instance : ${entryPath}`);
  }
  return resolveInside(installDir, entryPath);
};

/** Les deux canaux d'une instance ne doivent jamais se recouvrir. */
export const channelsAreIsolated = (
  rootPath: string,
  id: string,
): boolean => {
  const stable = path.resolve(instanceRootPath(rootPath, id, "stable"));
  const beta = path.resolve(instanceRootPath(rootPath, id, "beta"));
  return !(stable + path.sep).startsWith(beta + path.sep) && !(beta + path.sep).startsWith(stable + path.sep);
};
