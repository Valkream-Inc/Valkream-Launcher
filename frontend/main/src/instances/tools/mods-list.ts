/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Outil admin « liste de mods depuis un manifest » : à partir d'une liste de dépendances
 * Thunderstore (`Auteur-Nom-Version`), génère les `ModDisplay` (nom, image, description, lien)
 * de l'onglet Mods, prêts à coller dans `mods.config.json`.
 */

import type { ModDisplay } from "@shared/types";
import { pickKey } from "../../lib/json-key.js";
import { LocalizedError } from "../../lib/localized-error.js";

const DEPENDENCY = /^([^-\s]+)-([^-\s]+)-([^\s]+)$/;

export interface ModRef {
  author: string;
  name: string;
  version: string;
}

/**
 * Une dépendance par ligne, ou un tableau JSON ; lignes vides et `# commentaires` ignorés.
 * `key` désigne le tableau dans un document JSON (`dependencies`, `packs.0.mods`… voir `pickKey`) :
 * c'est le cas d'un manifest Thunderstore complet ou d'un fichier de config.
 */
export const parseModList = (text: string, key?: string): ModRef[] => {
  const trimmed = text.trim();
  let items: string[];
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const parsed = pickKey(JSON.parse(trimmed), key?.trim() || undefined);
    if (!Array.isArray(parsed)) throw new LocalizedError("err.jsonArray");
    items = parsed.map(String);
  } else {
    items = trimmed.split(/\r?\n/).map((line) => line.replace(/#.*/, "").trim().replace(/^[-*]\s+/, ""));
  }

  const seen = new Set<string>();
  const refs: ModRef[] = [];
  for (const item of items.filter(Boolean)) {
    const match = DEPENDENCY.exec(item.replace(/[",]/g, "").trim());
    if (!match) throw new LocalizedError("err.dependencyInvalid", { dependency: item });
    const key = `${match[1]}-${match[2]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push({ author: match[1], name: match[2], version: match[3] });
  }
  return refs;
};

interface PackageVersion {
  name?: string;
  description?: string;
  icon?: string;
  website_url?: string;
}

export type JsonFetcher = (url: string) => Promise<unknown>;

export interface ModsListResult {
  mods: ModDisplay[];
  /** Mods dont les infos n'ont pas pu être lues (l'entrée est quand même générée, avec l'image du CDN). */
  failed: { id: string; error: string }[];
}

/** Image d'un mod sur le CDN Thunderstore (repli quand l'API n'en donne pas). */
export const cdnIcon = (ref: ModRef): string =>
  `https://gcdn.thunderstore.io/live/repository/icons/${ref.author}-${ref.name}-${ref.version}.png`;

export interface PackagePage {
  author: string;
  name: string;
  /** Version indiquée dans le lien (sinon : la dernière). */
  version?: string;
}

const PACKAGE_PAGE = /^https:\/\/(?:www\.)?thunderstore\.io\/(?:c\/[\w-]+\/)?(?:p|package)\/([^/?#\s]+)\/([^/?#\s]+)(?:\/([\d.]+))?\/?(?:[?#]\S*)?$/;

/** Lien vers la page d'un mod Thunderstore (`/c/valheim/p/Auteur/Nom/`) : `null` pour tout autre lien. */
export const parsePackagePage = (url: string): PackagePage | null => {
  const match = PACKAGE_PAGE.exec(url.trim());
  return match ? { author: match[1], name: match[2], version: match[3] } : null;
};

interface PackageInfo {
  version_number?: string;
  dependencies?: string[];
  latest?: { version_number?: string; dependencies?: string[] };
}

/**
 * Mods d'une page Thunderstore : le mod lui-même (dernière version) puis, si demandé,
 * ses dépendances (cas d'un modpack). Les doublons sont retirés.
 */
export const refsFromPackagePage = async (
  page: PackagePage,
  fetchJson: JsonFetcher,
  apiUrl = "https://thunderstore.io",
  withDependencies = true,
): Promise<ModRef[]> => {
  const base = apiUrl.replace(/\/+$/, "");
  const path = `${encodeURIComponent(page.author)}/${encodeURIComponent(page.name)}/`;
  const info = (await fetchJson(
    `${base}/api/experimental/package/${path}${page.version ? `${encodeURIComponent(page.version)}/` : ""}`,
  )) as PackageInfo;
  const version = page.version ?? info.latest?.version_number ?? info.version_number;
  if (!version) throw new LocalizedError("err.packageNotFound", { name: `${page.author}-${page.name}` });
  const dependencies = withDependencies ? (page.version ? info.dependencies : info.latest?.dependencies) ?? [] : [];
  return parseModList(JSON.stringify([`${page.author}-${page.name}-${version}`, ...dependencies]));
};

/** Infos d'affichage de chaque mod via l'API Thunderstore (image, description, page). */
export const buildModsDisplay = async (
  refs: readonly ModRef[],
  fetchJson: JsonFetcher,
  apiUrl = "https://thunderstore.io",
  /** Appelé après chaque mod interrogé : (faits, total). */
  onProgress?: (done: number, total: number) => void,
): Promise<ModsListResult> => {
  let done = 0;
  const base = apiUrl.replace(/\/+$/, "");
  const failed: ModsListResult["failed"] = [];

  const mods = await Promise.all(
    refs.map(async (ref): Promise<ModDisplay> => {
      const id = `${ref.author}-${ref.name}`;
      const display: ModDisplay = {
        id,
        name: ref.name.replace(/_/g, " "),
        link: `${base}/package/${encodeURIComponent(ref.author)}/${encodeURIComponent(ref.name)}/`,
      };
      try {
        const info = (await fetchJson(
          `${base}/api/experimental/package/${encodeURIComponent(ref.author)}/${encodeURIComponent(ref.name)}/${encodeURIComponent(ref.version)}/`,
        )) as PackageVersion;
        display.icon = info.icon || cdnIcon(ref);
        if (info.description) display.description = info.description;
      } catch (error) {
        display.icon = cdnIcon(ref); // l'image est servie par le CDN même si l'API ne répond pas
        failed.push({ id, error: error instanceof Error ? error.message : String(error) });
      }
      onProgress?.(++done, refs.length);
      return display;
    }),
  );
  return { mods, failed };
};
