/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Validation des configs remote reçues (index et latest.yml).
 * Écrite à la main : le projet n'a pas de bibliothèque de schéma. Module pur.
 *
 * Une config invalide ne plante jamais le launcher : elle donne une liste
 * d'erreurs lisibles (affichées dans l'onglet Debug).
 */

import type {
  Contributor,
  ModDisplay,
  ReleaseConfig,
  ReleaseEntry,
  RemoteIndex,
} from "@shared/types";

import { isLocalContent, parseLocalContent } from "../install/local-content";
import { isValidKey } from "../../lib/json-key";
import { classifyLink, isFetchableLink, isPerPlatformContent } from "./link";
import { RELEASE_TIERS } from "./release-options";
import { isSafeRelativePath, isSafeSegment } from "../../lib/paths";
import { isValidRange } from "../../lib/version";

export type ValidationResult<T> =
  | { ok: true; value: T; errors: [] }
  | { ok: false; errors: string[] };

const PLATFORMS = ["win32", "linux", "darwin"];
const CHANNELS = ["stable", "beta"];
const TIERS = RELEASE_TIERS;
const ENTRY_TYPES = [
  "zip_url",
  "hash_url",
  "thunderstore_modpack_url",
  "steam_library",
  "nexus_modpack_url",
];

/** Types dont `content` est un manifeste de hash (`{ fichier: sha256 }`). */
const isHashType = (type: string): boolean => type === "hash_url" || type === "steam_library";
const RELEASE_ROOT_KEYS = ["version", "buildDate", ...TIERS];

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "";

const SHA256 = /^[a-f0-9]{64}$/i;
const THUNDERSTORE_DEPENDENCY = /^[^-\s]+-[^-\s]+-[^\s]+$/; // Auteur-Nom-Version

const finish = <T>(value: unknown, errors: string[]): ValidationResult<T> =>
  errors.length === 0
    ? { ok: true, value: value as T, errors: [] }
    : { ok: false, errors };

/* ------------------------------------------------------------------ */
/* Index                                                              */
/* ------------------------------------------------------------------ */

const checkLinkOrData = (
  value: unknown,
  where: string,
  checkData: (data: unknown, where: string) => string[],
): string[] => {
  if (typeof value === "string") {
    return isFetchableLink(value)
      ? []
      : [`${where} : lien invalide (attendu http(s)://… ou /chemin) : ${value}`];
  }
  return checkData(value, where);
};

const checkContributors = (data: unknown, where: string): string[] => {
  if (!Array.isArray(data)) return [`${where} : tableau attendu`];
  return (data as Partial<Contributor>[]).flatMap((contributor, index) =>
    isObject(contributor) && isNonEmptyString(contributor.name)
      ? []
      : [`${where}[${index}] : « name » requis`],
  );
};

const checkMods = (data: unknown, where: string): string[] => {
  if (!Array.isArray(data)) return [`${where} : tableau attendu`];
  return (data as Partial<ModDisplay>[]).flatMap((mod, index) =>
    isObject(mod) && isNonEmptyString(mod.name)
      ? []
      : [`${where}[${index}] : « name » requis`],
  );
};

const checkObject = (data: unknown, where: string): string[] =>
  isObject(data) ? [] : [`${where} : objet attendu`];

/**
 * Valide le `index.config.json` d'UN jeu.
 * @param expectedId id de l'instance qui charge ce fichier (doit être identique).
 */
export const validateRemoteIndex = (
  raw: unknown,
  expectedId?: string,
): ValidationResult<RemoteIndex> => {
  const errors: string[] = [];

  if (!isObject(raw)) return { ok: false, errors: ["index : objet attendu"] };
  if (raw.schemaVersion !== 1) {
    errors.push(`index.schemaVersion : 1 attendu, reçu ${String(raw.schemaVersion)}`);
  }

  const where = "index";

  if (!isNonEmptyString(raw.id) || !isSafeSegment(raw.id)) {
    errors.push(`${where}.id : identifiant invalide (lettres, chiffres, . _ -)`);
  } else if (expectedId !== undefined && raw.id !== expectedId) {
    errors.push(`${where}.id : « ${raw.id} » attendu « ${expectedId} »`);
  }

  if (!isObject(raw.enabled)) {
    errors.push(`${where}.enabled : objet attendu (win32, linux, darwin)`);
  } else {
    for (const [platform, value] of Object.entries(raw.enabled)) {
      if (!PLATFORMS.includes(platform)) {
        errors.push(`${where}.enabled.${platform} : plateforme inconnue (win32, linux, darwin)`);
      } else if (typeof value !== "boolean") {
        errors.push(`${where}.enabled.${platform} : booléen attendu`);
      }
    }
  }

  if (
    raw.requiredSpaceMb !== undefined &&
    !(typeof raw.requiredSpaceMb === "number" && Number.isFinite(raw.requiredSpaceMb) && raw.requiredSpaceMb > 0)
  ) {
    errors.push(`${where}.requiredSpaceMb : nombre positif attendu (Mo)`);
  }

  if (raw.channels !== undefined) {
    if (!isObject(raw.channels)) {
      errors.push(`${where}.channels : objet attendu`);
    } else {
      for (const [channel, link] of Object.entries(raw.channels)) {
        if (!CHANNELS.includes(channel)) {
          errors.push(`${where}.channels.${channel} : canal inconnu (stable, beta)`);
        } else if (!isFetchableLink(link)) {
          errors.push(`${where}.channels.${channel} : lien invalide`);
        }
      }
    }
  }

  const optionalParams: [string, (data: unknown, where: string) => string[]][] = [
    ["event", checkObject],
    ["maintenance", checkObject],
    ["contributors", checkContributors],
    ["mods", checkMods],
  ];
  for (const [key, checkData] of optionalParams) {
    if (raw[key] !== undefined) {
      errors.push(...checkLinkOrData(raw[key], `${where}.${key}`, checkData));
    }
  }

  return finish<RemoteIndex>(raw, errors);
};

/* ------------------------------------------------------------------ */
/* latest.yml                                                         */
/* ------------------------------------------------------------------ */

const checkContentValue = (
  type: string,
  content: unknown,
  where: string,
): string[] => {
  if (typeof content === "string" && isLocalContent(content)) {
    if (!isHashType(type) && type !== "thunderstore_modpack_url") {
      return [`${where} : local: réservé à hash_url, steam_library et thunderstore_modpack_url`];
    }
    return parseLocalContent(content) ? [] : [`${where} : local:<entrée>/<fichier> attendu (chemin relatif sûr) : ${content}`];
  }

  if (typeof content === "string") {
    return isFetchableLink(content)
      ? []
      : [`${where} : lien invalide (attendu http(s)://… ou /chemin) : ${content}`];
  }

  if (type === "zip_url") {
    return [`${where} : un lien vers l'archive est attendu`];
  }

  if (Array.isArray(content)) {
    if (isHashType(type)) return [`${where} : lien ou manifeste {chemin: sha256} attendu`];
    return content.flatMap((item, index) =>
      typeof item === "string" && THUNDERSTORE_DEPENDENCY.test(item)
        ? []
        : [`${where}[${index}] : « Auteur-Nom-Version » attendu`],
    );
  }

  if (isObject(content)) {
    if (!isHashType(type)) return [`${where} : lien ou liste attendu`];
    return Object.entries(content).flatMap(([filePath, hash]) => [
      ...(isSafeRelativePath(filePath) ? [] : [`${where}.${filePath} : chemin invalide`]),
      ...(typeof hash === "string" && SHA256.test(hash)
        ? []
        : [`${where}.${filePath} : sha256 attendu`]),
    ]);
  }

  return [`${where} : lien, liste ou manifeste attendu`];
};

const checkPathList = (value: unknown, where: string): string[] => {
  if (!Array.isArray(value)) return [`${where} : tableau attendu`];
  return value.flatMap((item, index) =>
    typeof item === "string" && isSafeRelativePath(item)
      ? []
      : [`${where}[${index}] : chemin relatif sûr attendu (sans « .. », ni lecteur)`],
  );
};

const checkPreserveList = (value: unknown, where: string): string[] => {
  if (!Array.isArray(value)) return [`${where} : tableau attendu`];
  return value.flatMap((item, index) => {
    const at = `${where}[${index}]`;
    if (typeof item === "string") {
      return isSafeRelativePath(item) ? [] : [`${at} : chemin relatif sûr attendu`];
    }
    if (!isObject(item)) return [`${at} : chemin ou { path, from } attendu`];
    const errors: string[] = [];
    if (typeof item.path !== "string" || !isSafeRelativePath(item.path)) {
      errors.push(`${at}.path : chemin relatif sûr attendu`);
    }
    if (item.from !== undefined && !isValidRange(item.from)) {
      errors.push(`${at}.from : plage de versions invalide (ex : >=1.2.0, 1.x, *)`);
    }
    for (const key of Object.keys(item)) {
      if (key !== "path" && key !== "from") errors.push(`${at}.${key} : clé inconnue (path, from)`);
    }
    return errors;
  });
};

/**
 * Une chaîne « lien » (`https://…`, `/chemin`) tient lieu de valeur pour les options de
 * données : le fichier est lu avant la validation (`flattenRelease`). Si la lecture a
 * échoué, l'erreur est déjà dans le rapport, inutile d'en ajouter une seconde ici.
 */
const isDataLink = (value: unknown): boolean => typeof value === "string" && isFetchableLink(value);

const checkEntry = (entry: unknown, where: string): string[] => {
  if (!isObject(entry)) return [`${where} : objet attendu`];
  const errors: string[] = [];

  if (!isNonEmptyString(entry.version) && typeof entry.version !== "number") {
    errors.push(`${where}.version : requise`);
  }

  // Injecté depuis la config main (entryPaths) par `flattenRelease`.
  if (entry.path === undefined) {
    errors.push(`${where}.path : aucun dossier d'installation dans la config main (entryPaths) pour cette entrée`);
  } else if (!isNonEmptyString(entry.path) || !isSafeRelativePath(entry.path)) {
    errors.push(`${where}.path : chemin relatif sûr requis (sans « .. », ni lecteur)`);
  }

  const type = typeof entry.type === "string" ? entry.type : "";
  if (!ENTRY_TYPES.includes(type) && !isDataLink(entry.type)) {
    errors.push(`${where}.type : ${ENTRY_TYPES.join(", ")} attendu`);
  }

  if (
    entry.hash !== undefined &&
    !isDataLink(entry.hash) &&
    !(typeof entry.hash === "string" && SHA256.test(entry.hash))
  ) {
    errors.push(`${where}.hash : sha256 hexadécimal attendu`);
  }

  if (entry.content === undefined || entry.content === null) {
    errors.push(`${where}.content : requis`);
  } else if (ENTRY_TYPES.includes(type)) {
    const content = entry.content as Parameters<typeof isPerPlatformContent>[0];
    if (isPerPlatformContent(content)) {
      for (const [platform, value] of Object.entries(content)) {
        errors.push(...checkContentValue(type, value, `${where}.content.${platform}`));
      }
    } else {
      errors.push(...checkContentValue(type, content, `${where}.content`));
    }
  }

  // `steam_library` : `hash-folder` est facultatif (fichiers à nous absents de Steam : config, mods…)
  if (type === "hash_url" && !isFetchableLink(entry["hash-folder"])) {
    errors.push(`${where}.hash-folder : URL de base des fichiers requise`);
  } else if (type === "steam_library" && entry["hash-folder"] !== undefined && !isFetchableLink(entry["hash-folder"])) {
    errors.push(`${where}.hash-folder : URL de base des fichiers attendue`);
  }

  if (entry.buildid !== undefined && !isDataLink(entry.buildid)) {
    if (type !== "steam_library") errors.push(`${where}.buildid : réservé à steam_library`);
    else if (typeof entry.buildid !== "string" && typeof entry.buildid !== "number") errors.push(`${where}.buildid : numéro de build attendu`);
  }

  if (entry.key !== undefined && !isDataLink(entry.key)) {
    if (!isHashType(type) && type !== "thunderstore_modpack_url") {
      errors.push(`${where}.key : réservé à hash_url, steam_library et thunderstore_modpack_url`);
    } else if (typeof entry.key !== "string" || !isValidKey(entry.key)) {
      errors.push(`${where}.key : chemin pointé attendu (ex : dependencies.mods, ou « . »)`);
    }
  }

  if (entry.zip !== undefined) {
    if (type !== "hash_url") errors.push(`${where}.zip : réservé à hash_url`);
    else if (!isFetchableLink(entry.zip)) errors.push(`${where}.zip : lien de l'archive attendu`);
  }

  if (entry.folder_in_zip !== undefined && !isDataLink(entry.folder_in_zip)) {
    if (type !== "zip_url" && type !== "hash_url") {
      errors.push(`${where}.folder_in_zip : réservé à zip_url et hash_url`);
    } else if (typeof entry.folder_in_zip !== "string" || !isSafeRelativePath(entry.folder_in_zip)) {
      errors.push(`${where}.folder_in_zip : chemin relatif sûr attendu`);
    }
  }

  if (entry["api-url"] !== undefined) {
    const apiUrl = entry["api-url"];
    const isApiType = type === "thunderstore_modpack_url" || type === "nexus_modpack_url";
    if (!isApiType) errors.push(`${where}.api-url : réservé à thunderstore et nexus`);
    else if (typeof apiUrl !== "string" || classifyLink(apiUrl) !== "url") {
      errors.push(`${where}.api-url : URL http(s) attendue`);
    }
  }

  for (const key of ["gameFolderToRemove", "to_ignore"] as const) {
    if (entry[key] !== undefined && !isDataLink(entry[key])) errors.push(...checkPathList(entry[key], `${where}.${key}`));
  }

  if (entry.gameFolderToPreserve !== undefined && !isDataLink(entry.gameFolderToPreserve)) {
    errors.push(...checkPreserveList(entry.gameFolderToPreserve, `${where}.gameFolderToPreserve`));
  }

  if (entry.optional !== undefined && !isDataLink(entry.optional)) {
    if (!isObject(entry.optional) || !isNonEmptyString(entry.optional.setting)) {
      errors.push(`${where}.optional : { setting: <nom du réglage> } attendu`);
    }
  }

  if (entry.dependencies !== undefined && !isDataLink(entry.dependencies)) {
    const dependencies = entry.dependencies;
    if (type !== "thunderstore_modpack_url") {
      errors.push(`${where}.dependencies : réservé à thunderstore_modpack_url`);
    } else if (!isObject(dependencies)) {
      errors.push(`${where}.dependencies : objet attendu ({ skip?: [Auteur-Nom] })`);
    } else if (
      dependencies.skip !== undefined &&
      !(Array.isArray(dependencies.skip) && dependencies.skip.every(isNonEmptyString))
    ) {
      errors.push(`${where}.dependencies.skip : liste de dossiers « Auteur-Nom » attendue`);
    }
  }

  return errors;
};

/**
 * Valide un `latest.yml` déjà parsé ET passé par `flattenRelease` (plateforme choisie,
 * liens de données lus, dossier d'installation injecté depuis la config main).
 */
export const validateReleaseConfig = (raw: unknown): ValidationResult<ReleaseConfig> => {
  const errors: string[] = [];

  if (!isObject(raw)) return { ok: false, errors: ["latest : objet attendu"] };

  if (typeof raw.version !== "string" || !/^\d+\.\d+\.\d+$/.test(raw.version)) {
    errors.push("latest.version : format X0.X1.X2 attendu (ex : 0.2.34)");
  }

  for (const key of Object.keys(raw)) {
    if (!RELEASE_ROOT_KEYS.includes(key)) {
      errors.push(`latest.${key} : clé inconnue (${TIERS.join(", ")})`);
    }
  }

  const seen = new Map<string, string>();
  for (const tier of TIERS) {
    const entries = raw[tier];
    if (entries === undefined || entries === null) continue;
    if (!isObject(entries)) {
      errors.push(`latest.${tier} : objet attendu`);
      continue;
    }

    for (const [name, entry] of Object.entries(entries)) {
      if (!/^[a-z0-9][a-z0-9_-]*$/.test(name)) {
        errors.push(`latest.${tier}.${name} : nom d'entrée invalide (minuscules, chiffres, - _)`);
      }
      if (seen.has(name)) {
        errors.push(`latest.${tier}.${name} : nom déjà utilisé dans ${seen.get(name)}`);
      }
      seen.set(name, tier);
      errors.push(...checkEntry(entry, `latest.${tier}.${name}`));
    }
  }

  return finish<ReleaseConfig>(raw, errors);
};

export type { ReleaseEntry };
