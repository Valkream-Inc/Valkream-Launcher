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
import { isNexusRef, NEXUS_API, parseNexusRef } from "../install/providers/nexus.js";

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

/** Le CDN d'images n'existe que pour Thunderstore ; ailleurs, seule l'API donne l'image. */
const fallbackIcon = (ref: ModRef, base: string): string | undefined =>
  /^https:\/\/(www\.)?thunderstore\.io$/.test(base) ? cdnIcon(ref) : undefined;

export interface PackagePage {
  /** API du site du lien (`https://thunderstore.io`, `https://hexium.gg`). */
  origin: string;
  author: string;
  name: string;
  /** Version indiquée dans le lien (sinon : la dernière). */
  version?: string;
}

/** Sites à l'API compatible Thunderstore dont on lit les pages de mod. */
const PACKAGE_HOSTS = ["thunderstore.io", "hexium.gg"];
const PACKAGE_PAGE = /^https:\/\/(?:www\.)?([a-z.]+)\/(?:c\/[\w-]+\/)?(?:p|package)\/([^/?#\s]+)\/([^/?#\s]+)(?:\/([\d.]+))?\/?(?:[?#]\S*)?$/;

/** Lien vers la page d'un mod Thunderstore ou Hexium (`/c/valheim/p/Auteur/Nom/`) : `null` pour tout autre lien. */
export const parsePackagePage = (url: string): PackagePage | null => {
  const match = PACKAGE_PAGE.exec(url.trim());
  if (!match || !PACKAGE_HOSTS.includes(match[1])) return null;
  return { origin: `https://${match[1]}`, author: match[2], name: match[3], version: match[4] };
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
  apiUrl = page.origin,
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
        display.icon = info.icon || fallbackIcon(ref, base);
        if (info.description) display.description = info.description;
      } catch (error) {
        display.icon = fallbackIcon(ref, base); // l'image est servie par le CDN même si l'API ne répond pas
        failed.push({ id, error: error instanceof Error ? error.message : String(error) });
      }
      onProgress?.(++done, refs.length);
      return display;
    }),
  );
  return { mods, failed };
};

/** Lignes `jeu-idMod-idFichier` d'une liste Nexus (texte ou tableau JSON) : `null` si ce n'est pas une liste Nexus. */
export const parseNexusList = (text: string, key?: string): string[] | null => {
  const trimmed = text.trim();
  let items: string[];
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = pickKey(JSON.parse(trimmed), key?.trim() || undefined);
      if (!Array.isArray(parsed)) return null;
      items = parsed.map(String);
    } catch {
      return null;
    }
  } else {
    items = trimmed.split(/\r?\n/).map((line) => line.replace(/#.*/, "").trim().replace(/^[-*]\s+/, ""));
  }
  items = items.map((item) => item.replace(/[",]/g, "").trim()).filter(Boolean);
  return items.length > 0 && items.every(isNexusRef) ? [...new Set(items)] : null;
};

/** Infos d'affichage de chaque mod Nexus (nom, résumé, image, page) via l'API (clé du joueur). */
export const buildNexusDisplay = async (
  items: readonly string[],
  fetchJson: JsonFetcher,
  onProgress?: (done: number, total: number) => void,
): Promise<ModsListResult> => {
  let done = 0;
  const failed: ModsListResult["failed"] = [];
  const mods = await Promise.all(
    items.map(async (item): Promise<ModDisplay> => {
      const ref = parseNexusRef(item);
      const display: ModDisplay = {
        id: `${ref.game}-${ref.mod}`,
        name: `Mod ${ref.mod}`,
        link: `https://www.nexusmods.com/${encodeURIComponent(ref.game)}/mods/${ref.mod}`,
      };
      try {
        const info = (await fetchJson(`${NEXUS_API}/v1/games/${encodeURIComponent(ref.game)}/mods/${ref.mod}.json`)) as {
          name?: string;
          summary?: string;
          picture_url?: string;
        };
        if (info.name) display.name = info.name;
        if (info.summary) display.description = info.summary;
        if (info.picture_url) display.icon = info.picture_url;
      } catch (error) {
        failed.push({ id: display.id, error: error instanceof Error ? error.message : String(error) });
      }
      onProgress?.(++done, items.length);
      return display;
    }),
  );
  return { mods, failed };
};
