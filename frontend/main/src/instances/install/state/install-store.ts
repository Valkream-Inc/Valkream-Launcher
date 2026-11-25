/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Fichiers propres à UNE installation (`<racine>/instances/<id>/<canal>/`) :
 * - `instance.state.json`    : version et hash installés de chaque entrée ;
 * - `instance.settings.json` : réglages de l'instance (toggles du renderer).
 * Stable et beta ont chacun les leurs : aucune donnée partagée entre canaux.
 */

import fs from "fs";
import path from "path";

import type { InstanceSettingValue } from "@shared/types";
import { LocalizedError } from "../../../lib/errors/localized-error.js";

export interface InstalledEntry {
  version: string;
  hash?: string;
  /** Dossiers de premier niveau possédés par l'entrée (ex : un dossier par mod Thunderstore). */
  owned?: string[];
  /** Dossier de l'entrée (`path` de la config main) à l'installation : s'il change, l'entrée est réinstallée. */
  path?: string;
  installedAt: string;
}

export interface InstallState {
  schemaVersion: 1;
  entries: Record<string, InstalledEntry>;
}

export const STATE_FILE = "instance.state.json";
export const SETTINGS_FILE = "instance.settings.json";

const SETTING_NAME = /^[A-Za-z][A-Za-z0-9_]*$/;

const readJsonFile = (filePath: string): unknown => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return undefined; // absent ou illisible : traité comme vide
  }
};

/** Écriture atomique : un fichier à moitié écrit ne remplace jamais l'ancien. */
const writeJsonFile = (filePath: string, data: unknown): void => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(data, null, 2));
  fs.renameSync(temporary, filePath);
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const readInstallState = (installDir: string): InstallState => {
  const raw = readJsonFile(path.join(installDir, STATE_FILE));
  const state: InstallState = { schemaVersion: 1, entries: {} };
  if (!isObject(raw) || !isObject(raw.entries)) return state;

  for (const [name, entry] of Object.entries(raw.entries)) {
    if (isObject(entry) && typeof entry.version === "string") {
      const owned = Array.isArray(entry.owned)
        ? entry.owned.filter((item): item is string => typeof item === "string")
        : undefined;
      state.entries[name] = {
        version: entry.version,
        ...(typeof entry.hash === "string" ? { hash: entry.hash } : {}),
        ...(owned ? { owned } : {}),
        ...(typeof entry.path === "string" ? { path: entry.path } : {}),
        installedAt: typeof entry.installedAt === "string" ? entry.installedAt : "",
      };
    }
  }
  return state;
};

export const writeInstallState = (installDir: string, state: InstallState): void =>
  writeJsonFile(path.join(installDir, STATE_FILE), state);

/** Enregistre qu'une entrée vient d'être installée. */
export const recordInstalledEntry = (
  installDir: string,
  name: string,
  entry: { version: string; hash?: string; owned?: string[]; path?: string },
  now: () => Date = () => new Date(),
): void => {
  const state = readInstallState(installDir);
  state.entries[name] = { ...entry, installedAt: now().toISOString() };
  writeInstallState(installDir, state);
};

/** Oublie une entrée (retirée ou désactivée). */
export const removeInstalledEntry = (installDir: string, name: string): void => {
  const state = readInstallState(installDir);
  if (!(name in state.entries)) return;
  delete state.entries[name];
  writeInstallState(installDir, state);
};

const isSettingValue = (value: unknown): value is InstanceSettingValue =>
  typeof value === "boolean" || typeof value === "string" || (typeof value === "number" && Number.isFinite(value));

export const readInstanceSettings = (
  installDir: string,
): Record<string, InstanceSettingValue> => {
  const raw = readJsonFile(path.join(installDir, SETTINGS_FILE));
  if (!isObject(raw)) return {};
  const settings: Record<string, InstanceSettingValue> = {};
  for (const [name, value] of Object.entries(raw)) {
    if (SETTING_NAME.test(name) && isSettingValue(value)) {
      settings[name] = value;
    }
  }
  return settings;
};

/**
 * Enregistre un réglage et retourne les réglages EFFECTIFS : valeurs par défaut de l'instance
 * (`defaults`) complétées par celles du fichier. Le fichier ne contient QUE les choix du joueur :
 * un défaut modifié par une nouvelle version du launcher s'applique donc à tous ceux qui ne l'ont pas changé.
 */
export const writeInstanceSetting = (
  installDir: string,
  name: string,
  value: InstanceSettingValue,
  defaults: Readonly<Record<string, InstanceSettingValue>> = {},
): Record<string, InstanceSettingValue> => {
  if (!SETTING_NAME.test(name)) throw new LocalizedError("err.settingName", { name });
  if (!isSettingValue(value)) {
    throw new LocalizedError("err.settingValue", { name });
  }
  const chosen = { ...readInstanceSettings(installDir), [name]: value };
  writeJsonFile(path.join(installDir, SETTINGS_FILE), chosen);
  return { ...defaults, ...chosen };
};
