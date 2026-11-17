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

import { classifyLink, isFetchableLink, isPerPlatformContent } from "./link";
import { isPathAllowed, isSafeRelativePath, isSafeSegment } from "./paths";

export type ValidationResult<T> =
  | { ok: true; value: T; errors: [] }
  | { ok: false; errors: string[] };

const PLATFORMS = ["win32", "linux", "darwin"];
const CHANNELS = ["stable", "beta"];
const TIERS = ["game-base", "game-breaking", "game-notbreaking"] as const;
const ENTRY_TYPES = [
  "zip_url",
  "hash_url",
  "thunderstore_modpack_url",
  "nexus_modpack_url",
];
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

export const validateRemoteIndex = (raw: unknown): ValidationResult<RemoteIndex> => {
  const errors: string[] = [];

  if (!isObject(raw)) return { ok: false, errors: ["index : objet attendu"] };
  if (raw.schemaVersion !== 1) {
    errors.push(`index.schemaVersion : 1 attendu, reçu ${String(raw.schemaVersion)}`);
  }
  if (!Array.isArray(raw.instances)) {
    errors.push("index.instances : tableau attendu");
    return { ok: false, errors };
  }

  const ids = new Set<string>();
  raw.instances.forEach((entry: unknown, index) => {
    const where = `index.instances[${index}]`;
    if (!isObject(entry)) {
      errors.push(`${where} : objet attendu`);
      return;
    }

    if (!isNonEmptyString(entry.id) || !isSafeSegment(entry.id)) {
      errors.push(`${where}.id : identifiant invalide (lettres, chiffres, . _ -)`);
    } else if (ids.has(entry.id)) {
      errors.push(`${where}.id : doublon « ${entry.id} »`);
    } else {
      ids.add(entry.id);
    }

    if (!isObject(entry.enabled)) {
      errors.push(`${where}.enabled : objet attendu (win32, linux, darwin)`);
    } else {
      for (const [platform, value] of Object.entries(entry.enabled)) {
        if (!PLATFORMS.includes(platform)) {
          errors.push(`${where}.enabled.${platform} : plateforme inconnue (win32, linux, darwin)`);
        } else if (typeof value !== "boolean") {
          errors.push(`${where}.enabled.${platform} : booléen attendu`);
        }
      }
    }

    if (entry.channels !== undefined) {
      if (!isObject(entry.channels)) {
        errors.push(`${where}.channels : objet attendu`);
      } else {
        for (const [channel, link] of Object.entries(entry.channels)) {
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
      if (entry[key] !== undefined) {
        errors.push(...checkLinkOrData(entry[key], `${where}.${key}`, checkData));
      }
    }
  });

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
  if (typeof content === "string") {
    return isFetchableLink(content)
      ? []
      : [`${where} : lien invalide (attendu http(s)://… ou /chemin) : ${content}`];
  }

  if (type === "zip_url") {
    return [`${where} : un lien vers l'archive est attendu`];
  }

  if (Array.isArray(content)) {
    if (type === "hash_url") return [`${where} : lien ou manifeste {chemin: sha256} attendu`];
    return content.flatMap((item, index) =>
      typeof item === "string" && THUNDERSTORE_DEPENDENCY.test(item)
        ? []
        : [`${where}[${index}] : « Auteur-Nom-Version » attendu`],
    );
  }

  if (isObject(content)) {
    if (type !== "hash_url") return [`${where} : lien ou liste attendu`];
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

const checkEntry = (
  entry: unknown,
  where: string,
  allowedPaths: readonly string[] | undefined,
): string[] => {
  if (!isObject(entry)) return [`${where} : objet attendu`];
  const errors: string[] = [];

  if (!isNonEmptyString(entry.version) && typeof entry.version !== "number") {
    errors.push(`${where}.version : requise`);
  }

  if (!isNonEmptyString(entry.path) || !isSafeRelativePath(entry.path)) {
    errors.push(`${where}.path : chemin relatif sûr requis (sans « .. », ni lecteur)`);
  } else if (allowedPaths && !isPathAllowed(entry.path, allowedPaths)) {
    errors.push(`${where}.path : « ${entry.path} » n'est pas autorisé pour cette instance`);
  }

  const type = typeof entry.type === "string" ? entry.type : "";
  if (!ENTRY_TYPES.includes(type)) {
    errors.push(`${where}.type : ${ENTRY_TYPES.join(", ")} attendu`);
  }

  if (entry.hash !== undefined && !(typeof entry.hash === "string" && SHA256.test(entry.hash))) {
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

  if (type === "hash_url" && !isFetchableLink(entry["hash-folder"])) {
    errors.push(`${where}.hash-folder : URL de base des fichiers requise`);
  }

  if (entry.folder_in_zip !== undefined) {
    if (type !== "zip_url") errors.push(`${where}.folder_in_zip : réservé à zip_url`);
    else if (typeof entry.folder_in_zip !== "string" || !isSafeRelativePath(entry.folder_in_zip)) {
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

  for (const key of ["gameFolderToRemove", "gameFolderToPreserve"] as const) {
    if (entry[key] !== undefined) errors.push(...checkPathList(entry[key], `${where}.${key}`));
  }

  if (entry.optional !== undefined) {
    if (!isObject(entry.optional) || !isNonEmptyString(entry.optional.setting)) {
      errors.push(`${where}.optional : { setting: <nom du réglage> } attendu`);
    }
  }

  return errors;
};

/**
 * Valide un `latest.yml` déjà parsé.
 * @param allowedPaths `allowedPaths` de la config main de l'instance (liste blanche des `path`).
 */
export const validateReleaseConfig = (
  raw: unknown,
  allowedPaths?: readonly string[],
): ValidationResult<ReleaseConfig> => {
  const errors: string[] = [];

  if (!isObject(raw)) return { ok: false, errors: ["latest : objet attendu"] };

  if (typeof raw.version !== "string" || !/^\d+\.\d+\.\d+\.\d+$/.test(raw.version)) {
    errors.push("latest.version : format X0.X1.X2.X3 attendu (ex : 0.2.34.37)");
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
      errors.push(...checkEntry(entry, `latest.${tier}.${name}`, allowedPaths));
    }
  }

  return finish<ReleaseConfig>(raw, errors);
};

export type { ReleaseEntry };
