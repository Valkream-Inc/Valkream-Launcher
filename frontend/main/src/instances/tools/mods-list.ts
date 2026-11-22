/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Outil admin « liste de mods depuis un manifest » : à partir d'une liste de dépendances
 * Thunderstore (`Auteur-Nom-Version`), génère les `ModDisplay` (nom, image, description, lien)
 * de l'onglet Mods, prêts à coller dans `mods.config.json`.
 */

import type { ModDisplay } from "@shared/types";
import { LocalizedError } from "../../lib/localized-error.js";

const DEPENDENCY = /^([^-\s]+)-([^-\s]+)-([^\s]+)$/;

export interface ModRef {
  author: string;
  name: string;
  version: string;
}

/** Une dépendance par ligne, ou un tableau JSON ; lignes vides et `# commentaires` ignorés. */
export const parseModList = (text: string): ModRef[] => {
  const trimmed = text.trim();
  let items: string[];
  if (trimmed.startsWith("[")) {
    const parsed: unknown = JSON.parse(trimmed);
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
  /** Mods dont les infos n'ont pas pu être lues (l'entrée est quand même générée, sans image). */
  failed: { id: string; error: string }[];
}

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
        if (info.icon) display.icon = info.icon;
        if (info.description) display.description = info.description;
      } catch (error) {
        failed.push({ id, error: error instanceof Error ? error.message : String(error) });
      }
      onProgress?.(++done, refs.length);
      return display;
    }),
  );
  return { mods, failed };
};
