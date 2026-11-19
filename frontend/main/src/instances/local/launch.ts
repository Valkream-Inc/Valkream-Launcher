/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Décide comment lancer une instance. Module pur : le lancement réel est fait par l'IPC.
 */

import fs from "fs";
import path from "path";

import type { InstanceSettingValue } from "@shared/types";

import type { InstanceMainConfig } from "../instances.types";
import type { InstallLocations } from "./instance-paths";

export type LaunchPlan =
  | { kind: "steam"; url: string }
  | { kind: "executable"; path: string; cwd: string };

/**
 * - réglage `launchSteam` actif et `steamAppId` connu → Steam ;
 * - sinon l'exécutable déclaré pour la plateforme, qui doit exister.
 */
export const planLaunch = (
  config: Pick<InstanceMainConfig, "steamAppId">,
  locations: InstallLocations,
  settings: Record<string, InstanceSettingValue>,
  exists: (file: string) => boolean = fs.existsSync,
): LaunchPlan => {
  if (settings.launchSteam === true && config.steamAppId !== undefined) {
    return { kind: "steam", url: `steam://rungameid/${config.steamAppId}` };
  }
  if (!locations.executable) {
    throw new Error("Aucun exécutable déclaré pour cette plateforme");
  }
  if (!exists(locations.executable)) {
    throw new Error(`Exécutable introuvable : ${locations.executable}`);
  }
  return { kind: "executable", path: locations.executable, cwd: path.dirname(locations.executable) };
};
