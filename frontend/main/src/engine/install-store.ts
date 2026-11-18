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

export interface InstalledEntry {
  version: string;
  hash?: string;
  /** Dossiers de premier niveau possédés par l'entrée (ex : un dossier par mod Thunderstore). */
  owned?: string[];
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
  entry: { version: string; hash?: string; owned?: string[] },
  now: () => Date = () => new Date(),
): void => {
  const state = readInstallState(installDir);
  state.entries[name] = { ...entry, installedAt: now().toISOString() };
  writeInstallState(installDir, state);
};

export const readInstanceSettings = (
  installDir: string,
): Record<string, InstanceSettingValue> => {
  const raw = readJsonFile(path.join(installDir, SETTINGS_FILE));
  if (!isObject(raw)) return {};
  const settings: Record<string, InstanceSettingValue> = {};
  for (const [name, value] of Object.entries(raw)) {
    if (SETTING_NAME.test(name) && (typeof value === "boolean" || typeof value === "string")) {
      settings[name] = value;
    }
  }
  return settings;
};

export const writeInstanceSetting = (
  installDir: string,
  name: string,
  value: InstanceSettingValue,
): Record<string, InstanceSettingValue> => {
  if (!SETTING_NAME.test(name)) throw new Error(`Nom de réglage invalide : ${name}`);
  if (typeof value !== "boolean" && typeof value !== "string") {
    throw new Error(`Valeur de réglage invalide pour ${name}`);
  }
  const settings = { ...readInstanceSettings(installDir), [name]: value };
  writeJsonFile(path.join(installDir, SETTINGS_FILE), settings);
  return settings;
};
