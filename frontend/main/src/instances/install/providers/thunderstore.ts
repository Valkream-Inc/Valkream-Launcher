/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * `thunderstore_modpack_url` : liste de dépendances `Auteur-Nom-Version`. Chaque mod
 * est extrait dans son propre dossier `<Auteur>-<Nom>` sous le dossier de l'entrée,
 * donc deux entrées partageant un même `path` (mods normaux et mods admin) ne
 * s'écrasent jamais. Les dossiers des mods retirés de la liste sont supprimés.
 * Option `dependencies` : résout aussi les dépendances transitives (manifest.json de chaque mod),
 * sauf celles listées dans `skip`. Sans elle, la liste doit être complète.
 * `api-url` accepte tout site à l'API compatible Thunderstore (ex : `https://hexium.gg`).
 */

import { createHash } from "crypto";
import fs from "fs";
import path from "path";

import { resolveInside } from "../../../lib/fs/paths.js";
import { commitStaged } from "../files/staging.js";
import { createGlobalProgress } from "./global-progress.js";
import type { Provider, ProviderContext, Uninstaller } from "./types.js";
import { LocalizedError } from "../../../lib/errors/localized-error.js";

const DEPENDENCY = /^([^-\s]+)-([^-\s]+)-([^\s]+)$/;

const parseDependency = (dependency: string) => {
  const match = DEPENDENCY.exec(dependency);
  if (!match) throw new LocalizedError("err.dependencyInvalid", { dependency });
  return { author: match[1], name: match[2], version: match[3], folder: `${match[1]}-${match[2]}` };
};

/** Dépendances déclarées dans le manifest.json d'un mod extrait (absent ou invalide : aucune). */
const readDependencies = (modDir: string) => {
  try {
    const raw = fs.readFileSync(path.join(modDir, "manifest.json"), "utf8").replace(/^\uFEFF/, "");
    const dependencies = (JSON.parse(raw) as { dependencies?: unknown }).dependencies;
    if (!Array.isArray(dependencies)) return [];
    return dependencies.flatMap((item) => {
      try {
        return [parseDependency(String(item))];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
};

type ModRef = ReturnType<typeof parseDependency>;

/**
 * Lien de téléchargement d'un mod et, si l'API du site les donne, ses dépendances directes.
 * Thunderstore : chemin standard. Autre site compatible (Hexium…) : `download_url` donné par son API,
 * avec repli sur le chemin standard si l'API ne répond pas. Une seule requête d'API par mod.
 */
const describeMod = async (
  apiUrl: string,
  mod: ModRef,
  context: Pick<ProviderContext, "resolver">,
  withDependencies: boolean,
): Promise<{ link: string; dependencies: ModRef[] | null }> => {
  const standard = `${apiUrl}/package/download/${encodeURIComponent(mod.author)}/${encodeURIComponent(mod.name)}/${encodeURIComponent(mod.version)}/`;
  // Thunderstore sans résolution des dépendances : le lien standard suffit, aucune requête d'API
  if (/^https:\/\/(www\.)?thunderstore\.io$/.test(apiUrl) && !withDependencies) return { link: standard, dependencies: null };
  try {
    const { value } = await context.resolver.getJson<{ download_url?: unknown; dependencies?: unknown }>(
      `${apiUrl}/api/experimental/package/${encodeURIComponent(mod.author)}/${encodeURIComponent(mod.name)}/${encodeURIComponent(mod.version)}/`,
    );
    const isStandardHost = /^https:\/\/(www\.)?thunderstore\.io$/.test(apiUrl);
    const link =
      !isStandardHost && typeof value.download_url === "string" && /^https:\/\//.test(value.download_url)
        ? value.download_url
        : standard;
    const dependencies = Array.isArray(value.dependencies)
      ? value.dependencies.flatMap((item) => {
          try {
            return [parseDependency(String(item))];
          } catch {
            return [];
          }
        })
      : null;
    return { link, dependencies };
  } catch {
    return { link: standard, dependencies: null }; // API muette : lien standard, dépendances lues après extraction
  }
};

/** Exécute `task` sur chaque élément, `limit` à la fois (pas de rafale vers l'API / le CDN). */
const mapLimited = async <T>(items: readonly T[], limit: number, task: (item: T) => Promise<void>): Promise<void> => {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) await task(items[next++]);
    }),
  );
};

export const thunderstoreProvider: Provider = async (context) => {
  const { entry, entryDir, tempDir, platform, resolver, io, name, signal, previousOwned, beforeCommit } = context;

  const content = entry.content;
  if (content === undefined || (typeof content === "object" && !Array.isArray(content))) {
    throw new LocalizedError("err.modsListMissing", { name, platform });
  }
  const list = await context.loadContent<string[]>();
  if (!Array.isArray(list)) throw new LocalizedError("err.modsListInvalid", { name });

  const apiUrl = (entry["api-url"] ?? "https://thunderstore.io").replace(/\/+$/, "");
  const mods = list.map(parseDependency);
  // Dépendances transitives (si `dependencies` est déclaré) : lues dans le manifest.json de chaque mod.
  const skip = new Set(entry.dependencies?.skip ?? []);
  const owned = mods.map((mod) => mod.folder);
  const queue = [...mods];

  // Chaque mod est extrait dans un dossier de préparation ; la bascule se fait une fois tout prêt.
  const stage = path.join(tempDir, `${name}.stage`);
  fs.rmSync(stage, { recursive: true, force: true });

  // Progression globale : un seul total, mesuré AVANT de télécharger (en-tête `content-length` de chaque mod,
  // 4 requêtes à la fois), puis figé : le total affiché ne change plus pendant le téléchargement.
  // Téléchargement = 80 % d'un mod, extraction = 20 %. Aucun nom de mod affiché.
  let total = queue.length;
  const progress = createGlobalProgress(
    (transfer) => context.report("download", context.t("progress.mods", { label: name }), transfer),
    () => total,
  );
  context.report("download", context.t("progress.mods", { label: name }));

  // 1) Résolution : lien + dépendances (si déclarées) de chaque mod, sans rien télécharger
  const links = new Map<string, string>();
  const resolved: ModRef[] = [];
  for (let index = 0; index < queue.length; index++) {
    const mod = queue[index];
    const info = await describeMod(apiUrl, mod, context, Boolean(entry.dependencies));
    signal?.throwIfAborted();
    links.set(mod.folder, info.link);
    resolved.push(mod);
    if (entry.dependencies && info.dependencies) {
      for (const dependency of info.dependencies) {
        if (skip.has(dependency.folder) || owned.includes(dependency.folder)) continue;
        owned.push(dependency.folder);
        queue.push(dependency);
        total++;
      }
    }
  }

  // 2) Tailles (HEAD) puis total figé
  if (io.size) {
    await mapLimited(resolved, 4, async (mod) => {
      const size = await io.size?.(resolver.urlOf(links.get(mod.folder)!), signal);
      if (size !== undefined) progress.expect(mod.folder, size);
    });
  }
  progress.lock();

  // 3) Téléchargement + extraction
  queue.length = 0;
  queue.push(...resolved);
  while (queue.length > 0) {
    const mod = queue.shift()!;
    const zipPath = path.join(tempDir, `${mod.folder}.zip`);
    const url = resolver.urlOf(links.get(mod.folder) ?? (await describeMod(apiUrl, mod, context, false)).link);
    let bytes = 0;
    await io.download(url, zipPath, signal, (transfer) => {
      bytes = transfer.processed ?? bytes;
      if (transfer.total) progress.expect(mod.folder, transfer.total);
      progress.update(mod.folder, (transfer.percent / 100) * 0.8, bytes);
    });

    const staged = path.join(stage, mod.folder);
    progress.update(mod.folder, 0.8, bytes);
    await io.extract(zipPath, staged, {
      accept: () => true,
      onProgress: (transfer) => progress.update(mod.folder, 0.8 + (transfer.percent / 100) * 0.2, bytes),
    });
    fs.rmSync(zipPath, { force: true });

    if (entry.dependencies) {
      for (const dependency of readDependencies(staged)) {
        if (skip.has(dependency.folder) || owned.includes(dependency.folder)) continue;
        owned.push(dependency.folder);
        queue.push(dependency);
        total++;
      }
    }
    progress.finish(mod.folder, bytes);
  }

  // Tout est prêt : bascule. Dossier du mod remplacé en entier (version propre, pas de résidus),
  // puis retrait des mods disparus depuis la dernière installation de CETTE entrée.
  beforeCommit();
  for (const folder of owned) fs.rmSync(resolveInside(entryDir, folder), { recursive: true, force: true });
  commitStaged(stage, entryDir);
  for (const folder of previousOwned.filter((item) => !owned.includes(item))) {
    fs.rmSync(resolveInside(entryDir, folder), { recursive: true, force: true });
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
