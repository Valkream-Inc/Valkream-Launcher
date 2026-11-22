/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Du latest.yml écrit sur le serveur à l'entrée utilisable sur cette machine.
 * Toutes les options d'une entrée, sauf `version`, peuvent :
 * - être déclinées par plateforme (`{ win32: …, linux: …, default: … }`) ;
 * - prendre une valeur inline, ou un lien (`https://…`, `/chemin`) vers un fichier
 *   JSON / YAML qui la contient.
 * `content`, `hash-folder` et `api-url` sont déjà des liens vers ce que télécharge le
 * provider : seule leur plateforme est choisie, le lien reste tel quel.
 * Le dossier d'installation (`path`) n'est jamais lu du remote : il vient de la config
 * main (`entryPaths`, par nom d'entrée) et est injecté ici. Un `path` écrit dans le
 * latest.yml est une erreur.
 * Une entrée dont `type`, `content` ou dossier d'installation n'a pas de valeur pour la
 * plateforme n'est pas proposée sur celle-ci (elle disparaît du rapport, sans erreur).
 */

import type { GamePlatform, RawOption, ReleaseConfig } from "@shared/types";

import { isFetchableLink } from "./link.js";
import type { ParamResolver } from "./ParamResolver.js";

export const RELEASE_TIERS = ["game-base", "game-details"] as const;

const PLATFORM_KEYS: readonly string[] = ["win32", "linux", "darwin", "default"];

/** Options dont une chaîne « lien » désigne un fichier contenant la valeur. */
const DATA_OPTIONS = [
  "type",
  "hash",
  "folder_in_zip",
  "buildid",
  "key",
  "gameFolderToRemove",
  "gameFolderToPreserve",
  "to_ignore",
  "optional",
  "dependencies",
] as const;

/** Sans valeur pour la plateforme, l'entrée n'est pas proposée. */
const REQUIRED_OPTIONS = ["type", "content"] as const;

type RawRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is RawRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/** Une table par plateforme : un objet dont TOUTES les clés sont des plateformes (ou `default`). */
export const isPlatformTable = (value: unknown): value is Record<string, unknown> =>
  isRecord(value) &&
  Object.keys(value).length > 0 &&
  Object.keys(value).every((key) => PLATFORM_KEYS.includes(key));

/** Valeur applicable à `platform` (clé exacte, sinon `default`). Hors table : la valeur elle-même. */
export const pickPlatform = (value: unknown, platform: GamePlatform): unknown =>
  isPlatformTable(value) ? (value[platform] ?? value.default) : value;

/**
 * Choisit la plateforme dans chaque option. Retourne `null` si l'entrée n'est pas
 * proposée sur cette plateforme. Ne touche pas aux liens de données.
 */
export const selectEntryPlatform = (entry: unknown, platform: GamePlatform): RawRecord | null => {
  if (!isRecord(entry)) return entry as never;

  const selected: RawRecord = {};
  for (const [key, value] of Object.entries(entry)) {
    if (key === "version") {
      selected[key] = value;
      continue;
    }
    const picked = pickPlatform(value, platform);
    if (picked === undefined || picked === null) {
      if (isPlatformTable(value) && (REQUIRED_OPTIONS as readonly string[]).includes(key)) {
        return null;
      }
      continue;
    }
    selected[key] = picked;
  }
  return selected;
};

/** Lit les options dont la valeur est un lien vers un fichier de données. */
const resolveEntryLinks = async (
  entry: unknown,
  platform: GamePlatform,
  resolver: ParamResolver,
  prefix: string,
): Promise<{ entry: unknown; errors: string[] }> => {
  if (!isRecord(entry)) return { entry, errors: [] };

  const resolved: RawRecord = { ...entry };
  const errors: string[] = [];

  await Promise.all(
    DATA_OPTIONS.map(async (key) => {
      const value = entry[key];
      if (typeof value !== "string" || !isFetchableLink(value)) return;
      try {
        const { value: data } = await resolver.getYaml<unknown>(value);
        // Le fichier peut lui-même être décliné par plateforme.
        const picked = pickPlatform(data, platform);
        if (picked === undefined || picked === null) delete resolved[key];
        else resolved[key] = picked;
      } catch (error) {
        errors.push(
          `${prefix}.${key} : lien illisible (${value}) : ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }),
  );

  return { entry: resolved, errors };
};

export interface FlatRelease {
  /** Release utilisable sur cette machine (même forme que `ReleaseConfig`, validation à faire). */
  release: ReleaseConfig;
  /** Erreurs de lecture des liens de données (`latest.<niveau>.<entrée>.<option> : …`). */
  errors: string[];
}

/**
 * Applique la plateforme puis lit les liens de données de toutes les entrées.
 * Les clés inconnues sont conservées telles quelles (la validation les signale).
 */
export const flattenRelease = async (
  raw: unknown,
  platform: GamePlatform,
  resolver: ParamResolver,
  entryPaths: Readonly<Record<string, RawOption<string>>>,
): Promise<FlatRelease> => {
  if (!isRecord(raw)) return { release: raw as ReleaseConfig, errors: [] };

  const release: RawRecord = { ...raw };
  const errors: string[] = [];

  for (const tier of RELEASE_TIERS) {
    const entries = raw[tier];
    if (!isRecord(entries)) continue;

    const flat: RawRecord = {};
    await Promise.all(
      Object.entries(entries).map(async ([name, entry]) => {
        const prefix = `latest.${tier}.${name}`;
        const selected = selectEntryPlatform(entry, platform);
        if (selected === null) return; // non proposée sur cette plateforme

        // Le dossier d'installation est décidé par le main, jamais par le remote.
        const declaredPath = isRecord(entry) ? entry.path : undefined;
        if (declaredPath !== undefined) {
          errors.push(`${prefix}.path : interdit dans le latest.yml (le dossier est décidé par la config main, entryPaths)`);
        }
        delete selected.path;
        if (name in entryPaths) {
          const installPath = pickPlatform(entryPaths[name], platform);
          if (installPath === undefined || installPath === null) return; // pas de dossier pour cette plateforme
          selected.path = installPath;
        }

        const result = await resolveEntryLinks(selected, platform, resolver, prefix);
        flat[name] = result.entry;
        errors.push(...result.errors);
      }),
    );
    // Ordre d'origine conservé (Promise.all termine dans un ordre quelconque).
    release[tier] = Object.fromEntries(
      Object.keys(entries)
        .filter((name) => name in flat)
        .map((name) => [name, flat[name]]),
    );
  }

  return { release: release as unknown as ReleaseConfig, errors };
};

