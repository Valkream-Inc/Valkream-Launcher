/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Arguments passés à l'exécutable au lancement, éventuellement selon les réglages du joueur.
 * Module pur. Les arguments sont transmis tels quels (tableau, jamais via un shell) : une valeur
 * de réglage ne peut donc pas injecter de commande.
 *
 *   launchArgs: [
 *     "-Xmx{ram}M",                                        // toujours (ram = réglage slider)
 *     { when: "fullscreen", args: ["--fullscreen"] },      // si le réglage est actif
 *     { when: "lang", equals: "fr", args: ["--lang", "fr_FR"] },
 *     "-jar", "server.jar",
 *   ]
 */

import type { GamePlatform, InstanceSettingValue } from "@shared/types";
import { LocalizedError } from "../../../lib/errors/localized-error.js";

export type LaunchArg =
  | string
  | {
      /** Réglage qui conditionne ces arguments (absent : toujours). */
      when?: string;
      /** Valeur attendue du réglage (absent : le réglage doit être « actif »). */
      equals?: InstanceSettingValue;
      /** Arguments ajoutés ; `{réglage}` est remplacé par la valeur du réglage. */
      args: readonly string[];
    };

/** Liste unique, ou une liste par plateforme (`default` en repli). */
export type LaunchArgs = readonly LaunchArg[] | Partial<Record<GamePlatform | "default", readonly LaunchArg[]>>;

type Settings = Readonly<Record<string, InstanceSettingValue>>;

/** Réglage « actif » : `true`, nombre non nul, texte non vide autre que `false`. */
const isOn = (value: InstanceSettingValue | undefined): boolean =>
  value === true || (typeof value === "number" && value !== 0) || (typeof value === "string" && value !== "" && value !== "false");

const interpolate = (template: string, settings: Settings): string =>
  template.replace(/\{([A-Za-z0-9_]+)\}/g, (_match, name: string) => {
    const value = settings[name];
    if (value === undefined) throw new LocalizedError("err.launchArg", { template, name });
    return String(value);
  });

export const buildLaunchArgs = (spec: LaunchArgs | undefined, settings: Settings, platform: GamePlatform): string[] => {
  if (!spec) return [];
  const list = Array.isArray(spec)
    ? (spec as readonly LaunchArg[])
    : ((spec as Partial<Record<GamePlatform | "default", readonly LaunchArg[]>>)[platform] ??
      (spec as Partial<Record<"default", readonly LaunchArg[]>>).default ??
      []);

  const args: string[] = [];
  for (const item of list) {
    if (typeof item === "string") {
      args.push(interpolate(item, settings));
      continue;
    }
    if (item.when !== undefined) {
      const value = settings[item.when];
      const enabled = item.equals === undefined ? isOn(value) : value === item.equals;
      if (!enabled) continue;
    }
    args.push(...item.args.map((arg) => interpolate(arg, settings)));
  }
  return args;
};
