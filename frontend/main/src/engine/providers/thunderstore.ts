/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * `thunderstore_modpack_url` : liste de dépendances `Auteur-Nom-Version`. Chaque mod
 * est extrait dans son propre dossier `<Auteur>-<Nom>` sous le dossier de l'entrée,
 * donc deux entrées partageant un même `path` (mods normaux et mods admin) ne
 * s'écrasent jamais. Les dossiers des mods retirés de la liste sont supprimés.
 * Limite : les dépendances transitives ne sont pas résolues (la liste doit être complète).
 */

import { createHash } from "crypto";
import fs from "fs";
import path from "path";

import { resolveInside } from "../paths";
import type { Provider, Uninstaller } from "./types";

const DEPENDENCY = /^([^-\s]+)-([^-\s]+)-([^\s]+)$/;

export const parseDependency = (dependency: string) => {
  const match = DEPENDENCY.exec(dependency);
  if (!match) throw new Error(`Dépendance invalide : ${dependency}`);
  return { author: match[1], name: match[2], version: match[3], folder: `${match[1]}-${match[2]}` };
};

export const thunderstoreProvider: Provider = async (context) => {
  const { entry, entryDir, tempDir, platform, resolver, io, name, signal, previousOwned } = context;

  const content = entry.content;
  if (content === undefined || (typeof content === "object" && !Array.isArray(content))) {
    throw new Error(`${name} : liste de mods absente pour la plateforme ${platform}`);
  }
  const { value: list } = await resolver.getJson<string[]>(content as string | string[]);
  if (!Array.isArray(list)) throw new Error(`${name} : liste de mods invalide`);

  const apiUrl = (entry["api-url"] ?? "https://thunderstore.io").replace(/\/+$/, "");
  const mods = list.map(parseDependency);
  fs.mkdirSync(entryDir, { recursive: true });

  const owned = mods.map((mod) => mod.folder);

  // Mods retirés de la liste depuis la dernière installation de CETTE entrée.
  for (const folder of previousOwned.filter((item) => !owned.includes(item))) {
    fs.rmSync(resolveInside(entryDir, folder), { recursive: true, force: true });
  }

  let done = 0;
  for (const mod of mods) {
    context.report("download", `${mod.folder} ${mod.version} (${++done}/${mods.length})`);
    const zipPath = path.join(tempDir, `${mod.folder}.zip`);
    const url = resolver.urlOf(
      `${apiUrl}/package/download/${encodeURIComponent(mod.author)}/${encodeURIComponent(mod.name)}/${encodeURIComponent(mod.version)}/`,
    );
    await io.download(url, zipPath, signal, (transfer) =>
      context.report("download", `${mod.folder} ${mod.version} (${done}/${mods.length})`, transfer),
    );

    const destination = resolveInside(entryDir, mod.folder);
    fs.rmSync(destination, { recursive: true, force: true }); // version propre, pas de résidus
    context.report("extract", `Extraction de ${mod.folder}`);
    await io.extract(zipPath, destination, { accept: () => true });
    fs.rmSync(zipPath, { force: true });
  }

  const hash = createHash("sha256").update([...list].sort().join("\n")).digest("hex");
  return { hash: entry.hash ?? hash, owned };
};

/** Retire les dossiers des mods installés par cette entrée (et eux seuls). */
export const thunderstoreUninstall: Uninstaller = async ({ entryDir, previousOwned }) => {
  for (const folder of previousOwned) {
    fs.rmSync(resolveInside(entryDir, folder), { recursive: true, force: true });
  }
};
