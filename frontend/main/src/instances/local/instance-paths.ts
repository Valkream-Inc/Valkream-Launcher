/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Chemins d'une installation, tous dérivés de la config main de l'instance.
 * Module pur côté Electron (le chemin racine est injecté).
 */

import path from "path";

import type { Channel, GamePlatform } from "@shared/types";

import type { InstanceMainConfig } from "../instances.types.js";
import { instanceRootPath, resolveInside } from "../../lib/fs/paths.js";

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
 * Dossier d'une entrée (son `path` vient de la config main).
 * Lève si le chemin sort de l'installation.
 */
export const entryDirectory = (installDir: string, entryPath: string): string =>
  resolveInside(installDir, entryPath);

