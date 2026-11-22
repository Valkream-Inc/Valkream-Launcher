/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Décide comment lancer une instance. Module pur : le lancement réel est fait par l'IPC.
 */

import fs from "fs";
import path from "path";

import type { GamePlatform, InstanceSettingValue } from "@shared/types";

import { resolveInside } from "../../lib/paths.js";

import type { InstanceMainConfig } from "../instances.types.js";
import type { InstallLocations } from "./instance-paths.js";
import { buildLaunchArgs } from "./launch-args.js";
import { LocalizedError } from "../../lib/localized-error.js";

export type LaunchPlan =
  /** Jeu sans exécutable déclaré, lancé par Steam (`launchSteam` actif). */
  | { kind: "steam"; url: string }
  | {
      kind: "executable";
      /** Fichier du jeu, ou commande du PATH (`java`) quand `command` est déclarée. */
      path: string;
      cwd: string;
      args: string[];
      /** `launchSteam` actif : démarrer Steam avant (vérification de possession du jeu). */
      ensureSteam: boolean;
    };

/**
 * - `command` déclarée pour la plateforme (ex : `java`) : lancée depuis le PATH ;
 * - sinon l'exécutable déclaré, qui doit exister ;
 * - sans exécutable : Steam lance le jeu si `launchSteam` est actif, sinon erreur.
 * `launchSteam` (avec un `steamAppId`) fait démarrer Steam avant le jeu ; `launchArgs` donne les arguments.
 */
export const planLaunch = (
  config: Pick<InstanceMainConfig, "steamAppId" | "command" | "launchCwd" | "launchArgs">,
  locations: InstallLocations,
  settings: Record<string, InstanceSettingValue>,
  { platform = process.platform as GamePlatform, exists = fs.existsSync }: {
    platform?: GamePlatform;
    exists?: (file: string) => boolean;
  } = {},
): LaunchPlan => {
  const ensureSteam = settings.launchSteam === true && config.steamAppId !== undefined;
  const args = buildLaunchArgs(config.launchArgs, settings, platform);
  const cwdOverride = config.launchCwd ? resolveInside(locations.installDir, config.launchCwd) : undefined;

  const command = config.command?.[platform];
  if (command) {
    return { kind: "executable", path: command, cwd: cwdOverride ?? locations.installDir, args, ensureSteam };
  }

  if (!locations.executable) {
    if (ensureSteam) return { kind: "steam", url: `steam://rungameid/${config.steamAppId}` };
    throw new LocalizedError("err.noExecutable");
  }
  if (!exists(locations.executable)) {
    throw new LocalizedError("err.executableMissing", { path: locations.executable });
  }
  return {
    kind: "executable",
    path: locations.executable,
    cwd: cwdOverride ?? path.dirname(locations.executable),
    args,
    ensureSteam,
  };
};
