/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Contenu d'une entrée (`content` de `hash_url` / `thunderstore_modpack_url`) lu depuis
 * un fichier DÉJÀ INSTALLÉ par une autre entrée, au lieu d'un lien distant :
 *
 *   content: local:cfg/modpack.json     → fichier `modpack.json` du dossier de l'entrée `cfg`
 *   key: dependencies.mods              → (optionnel) données à l'intérieur du fichier
 *
 * Cas typique : la liste des mods de base est livrée dans le zip de config. Le dossier
 * de `cfg` est décidé par la config main (`entryPaths`) : le remote ne choisit jamais un chemin.
 * L'entrée source doit être installée avant (déclarée avant dans le latest.yml).
 */

import fs from "fs";

import type { ReleaseConfig, ReleaseEntry } from "@shared/types";

import { pickKey } from "../../../lib/format/json-key.js";
import { isSafeRelativePath, resolveInside } from "../../../lib/fs/paths.js";
import type { ParamResolver } from "../../remote/ParamResolver.js";
import { entryDirectory } from "../../local/instance-paths.js";
import { LocalizedError } from "../../../lib/errors/localized-error.js";

export const LOCAL_PREFIX = "local:";

export const isLocalContent = (value: unknown): value is string =>
  typeof value === "string" && value.trim().toLowerCase().startsWith(LOCAL_PREFIX);

/** `local:<entrée>/<chemin relatif>` → `{ entry, file }`, ou `null` si la forme est invalide. */
export const parseLocalContent = (value: string): { entry: string; file: string } | null => {
  const match = /^local:([^/\s]+)\/(.+)$/i.exec(value.trim());
  if (!match || !isSafeRelativePath(match[2])) return null;
  return { entry: match[1], file: match[2] };
};

/** Chemin absolu du fichier local désigné ; erreur claire si l'entrée ou le fichier manque. */
export const localContentPath = (spec: string, installDir: string, release: ReleaseConfig | undefined): string => {
  const parsed = parseLocalContent(spec);
  if (!parsed) throw new LocalizedError("err.localInvalid", { spec });

  const source = (["game-base", "game-details"] as const)
    .map((tier) => release?.[tier]?.[parsed.entry])
    .find((entry): entry is ReleaseEntry => entry !== undefined);
  if (!source) throw new LocalizedError("err.localUnknown", { entry: parsed.entry });

  const fullPath = resolveInside(entryDirectory(installDir, source.path), parsed.file);
  if (!fs.existsSync(fullPath)) {
    throw new LocalizedError("err.localAbsent", { file: parsed.file, entry: parsed.entry });
  }
  return fullPath;
};

/** Document JSON du `content` d'une entrée (lien distant, donnée inline ou `local:`), puis `key`. */
export const loadEntryContent = async <T>(
  resolver: ParamResolver,
  entry: ReleaseEntry,
  installDir: string,
  release: ReleaseConfig | undefined,
): Promise<T> => {
  const content = entry.content;
  if (isLocalContent(content)) {
    const raw = fs.readFileSync(localContentPath(content, installDir, release), "utf8").replace(/^﻿/, "");
    return pickKey<T>(JSON.parse(raw), entry.key);
  }
  const { value } = await resolver.getJson<unknown>(content as string | Record<string, string> | string[]);
  return pickKey<T>(value, entry.key);
};
