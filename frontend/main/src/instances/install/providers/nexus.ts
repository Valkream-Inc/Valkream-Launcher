/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * `nexus_modpack_url` : liste de fichiers Nexus Mods `<jeu>-<idMod>-<idFichier>` (ex : `valheim-1234-5678`).
 * Chaque mod est extrait dans son propre dossier `nexus-<idMod>` sous le dossier de l'entrée, comme pour
 * Thunderstore (mêmes garanties : bascule atomique, dossiers des mods retirés supprimés).
 *
 * Nexus impose la clé API PERSONNELLE du joueur (réglage « Clé API Nexus Mods », jamais écrite dans
 * le remote ni dans le journal). Seuls les membres Premium obtiennent un lien de téléchargement direct :
 * sans Premium, Nexus exige un clic sur son site (lien `nxm://`), donc impossible à automatiser.
 * Seules les archives `.zip` sont gérées (pas de `.7z` / `.rar`).
 */

import { createHash } from "crypto";
import fs from "fs";
import path from "path";

import { HttpError, httpGetText } from "../../../lib/net/http.js";
import { LocalizedError } from "../../../lib/errors/localized-error.js";
import { resolveInside } from "../../../lib/fs/paths.js";
import { commitStaged } from "../files/staging.js";
import { createGlobalProgress } from "./global-progress.js";
import type { Provider, Uninstaller } from "./types.js";

export const NEXUS_API = "https://api.nexusmods.com";
const NEXUS_REF = /^([a-z0-9_]+)-(\d+)-(\d+)$/;

export interface NexusRef {
  game: string;
  mod: string;
  file: string;
  folder: string;
}

export const parseNexusRef = (item: string): NexusRef => {
  const match = NEXUS_REF.exec(item.trim());
  if (!match) throw new LocalizedError("err.nexusReference", { item });
  return { game: match[1], mod: match[2], file: match[3], folder: `nexus-${match[2]}` };
};

export const isNexusRef = (item: string): boolean => NEXUS_REF.test(item.trim());

/** En-têtes d'une requête à l'API Nexus (la clé n'est jamais affichée ni journalisée). */
export const nexusHeaders = (apiKey: string): Record<string, string> => ({
  apikey: apiKey,
  "Application-Name": "Valkream-Launcher",
  Accept: "application/json",
});

/** Lecture JSON de l'API Nexus ; 401 : clé refusée, 403 : compte non Premium. */
export const nexusGetJson = async (url: string, apiKey: string, signal?: AbortSignal): Promise<unknown> => {
  if (!apiKey.trim()) throw new LocalizedError("err.nexusKeyMissing");
  try {
    return JSON.parse(await httpGetText(url, { headers: nexusHeaders(apiKey.trim()), timeout: 15_000, signal })) as unknown;
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) throw new LocalizedError("err.nexusKeyInvalid");
    if (error instanceof HttpError && error.status === 403) throw new LocalizedError("err.nexusPremium");
    throw error;
  }
};

/** Lien de téléchargement direct d'un fichier (Premium). */
export const nexusDownloadLink = async (apiUrl: string, ref: NexusRef, apiKey: string, signal?: AbortSignal): Promise<string> => {
  const links = (await nexusGetJson(
    `${apiUrl}/v1/games/${encodeURIComponent(ref.game)}/mods/${ref.mod}/files/${ref.file}/download_link.json`,
    apiKey,
    signal,
  )) as { URI?: unknown }[];
  const uri = Array.isArray(links) ? links.find((link) => typeof link.URI === "string")?.URI : undefined;
  if (typeof uri !== "string" || !/^https:\/\//.test(uri)) throw new LocalizedError("err.nexusNoLink", { name: `${ref.game}-${ref.mod}-${ref.file}` });
  return uri;
};

export const nexusProvider: Provider = async (context) => {
  const { entry, entryDir, tempDir, io, name, signal, previousOwned, beforeCommit } = context;

  const list = await context.loadContent<string[]>();
  if (!Array.isArray(list)) throw new LocalizedError("err.modsListInvalid", { name });
  const refs = list.map((item) => parseNexusRef(String(item)));
  const apiUrl = (entry["api-url"] ?? NEXUS_API).replace(/\/+$/, "");
  const apiKey = await context.nexusApiKey();
  if (refs.length > 0 && !apiKey.trim()) throw new LocalizedError("err.nexusKeyMissing");

  const stage = path.join(tempDir, `${name}.stage`);
  fs.rmSync(stage, { recursive: true, force: true });

  const progress = createGlobalProgress(
    (transfer) => context.report("download", context.t("progress.mods", { label: name }), transfer),
    () => refs.length,
  );
  context.report("download", context.t("progress.mods", { label: name }));

  for (const ref of refs) {
    const url = context.resolver.urlOf(await nexusDownloadLink(apiUrl, ref, apiKey, signal));
    if (!/\.zip$/i.test(new URL(url).pathname)) {
      throw new LocalizedError("err.nexusArchiveFormat", { name: `${ref.game}-${ref.mod}-${ref.file}` });
    }
    const zipPath = path.join(tempDir, `${ref.folder}.zip`);
    let bytes = 0;
    await io.download(url, zipPath, signal, (transfer) => {
      bytes = transfer.processed ?? bytes;
      progress.update(ref.folder, (transfer.percent / 100) * 0.8, bytes);
    });
    progress.update(ref.folder, 0.8, bytes);
    await io.extract(zipPath, path.join(stage, ref.folder), {
      accept: () => true,
      onProgress: (transfer) => progress.update(ref.folder, 0.8 + (transfer.percent / 100) * 0.2, bytes),
    });
    fs.rmSync(zipPath, { force: true });
    progress.finish(ref.folder, bytes);
  }

  beforeCommit();
  const owned = refs.map((ref) => ref.folder);
  for (const folder of owned) fs.rmSync(resolveInside(entryDir, folder), { recursive: true, force: true });
  commitStaged(stage, entryDir);
  for (const folder of previousOwned.filter((item) => !owned.includes(item))) {
    fs.rmSync(resolveInside(entryDir, folder), { recursive: true, force: true });
  }

  const hash = createHash("sha256").update([...list].sort().join("\n")).digest("hex");
  return { hash: entry.hash ?? hash, owned };
};

/** Retire les dossiers des mods installés par cette entrée (et eux seuls). */
export const nexusUninstall: Uninstaller = async ({ entryDir, previousOwned }) => {
  for (const folder of previousOwned) fs.rmSync(resolveInside(entryDir, folder), { recursive: true, force: true });
};
