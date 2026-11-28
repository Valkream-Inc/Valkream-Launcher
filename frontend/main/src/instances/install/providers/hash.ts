/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * `hash_url` : l'entrée est un manifeste `{ fichier: sha256 }`. Seuls les fichiers
 * absents ou différents sont récupérés ; chacun est vérifié avant d'être mis en place (4 téléchargements en parallèle).
 * `zip` (optionnel) : archive de tous les fichiers. Quand plus de la moitié des fichiers
 * est à récupérer (installation complète), elle est téléchargée en une fois ; les fichiers
 * absents de l'archive ou au mauvais hash sont repris un par un via `hash-folder`.
 * Les fichiers sont préparés dans un dossier temporaire puis basculés d'un coup (atomique) ;
 * un téléchargement interrompu est repris à la synchronisation suivante.
 * `to_ignore` : jamais vérifié ni touché. Fichiers conservés : gardés s'ils existent.
 * Les hash du disque passent par le cache de l'installation (`HashCache`).
 *
 * `steam_library` : même manifeste, mais les fichiers viennent d'abord de l'installation Steam du
 * joueur (copie, jamais modifiée) : on n'héberge pas le jeu. Un fichier de Steam au mauvais hash
 * (autre version du jeu) est refusé ; un fichier absent de Steam est pris dans `hash-folder` s'il
 * est déclaré (nos propres fichiers). Si la version ne correspond pas : erreur explicite avec les
 * `buildid` installé / attendu.
 *
 * `depot_steam` : comme `steam_library`, mais la bibliothèque Steam du joueur n'est jamais consultée : le jeu
 * vient toujours de DepotDownloader (`<installation>/.depot/game`, version exacte du depot déclaré).
 */

import fs from "fs";
import path from "path";

import { createHash } from "crypto";

import { GameSourceError } from "../game-source.js";
import { LocalizedError } from "../../../lib/errors/localized-error.js";
import { hashFile, manifestHash, type Manifest } from "../state/manifest.js";
import { runPool } from "../../../lib/net/concurrency.js";
import { copyFileWithProgress } from "../../../lib/fs/copy-progress.js";
import { resolveInside } from "../../../lib/fs/paths.js";
import { matchesAny, normalizeRelative } from "../../../lib/format/patterns.js";
import { shouldWriteFile } from "../files/preserve.js";
import { commitStaged, stageFile } from "../files/staging.js";
import { fetchArchive } from "./archive.js";
import { createGlobalProgress } from "./global-progress.js";
import { progressOf } from "../state/progress.js";
import type { Provider, ProviderContext } from "./types.js";

/** Téléchargements simultanés de fichiers individuels. */
const DOWNLOAD_CONCURRENCY = 4;

/** Requêtes de taille simultanées (HEAD) avant le téléchargement. */
const SIZE_CONCURRENCY = 8;

/** Part de fichiers à récupérer au-delà de laquelle on préfère l'archive aux fichiers un par un. */
const ZIP_MIN_RATIO = 0.5;

const encodePath = (relative: string): string =>
  relative.split("/").map(encodeURIComponent).join("/");

/** Récupère l'archive (zip ou tar.gz) et en extrait seulement `files` ; retourne le dossier d'extraction. */
const extractFromZip = async (
  context: ProviderContext,
  zipUrl: string,
  files: ReadonlySet<string>,
): Promise<string> => {
  const extractDir = path.join(context.tempDir, `${context.name}.unzipped`);
  await fetchArchive(context, zipUrl, extractDir, (relative) => files.has(relative), `${context.name} : archive`);
  return extractDir;
};

const createHashProvider = (source: "remote" | "steam" | "depot"): Provider => async (context) => {
  const { entry, entryDir, tempDir, plan, platform, resolver, io, hashes, name, signal, beforeCommit } = context;

  const content = entry.content;
  if (content === undefined || Array.isArray(content)) {
    throw new LocalizedError("err.manifestMissing", { name, platform });
  }
  const manifest = await context.loadContent<Manifest>();

  // Intégrité du manifeste lui-même : le hash déclaré par le latest.yml fait foi.
  const computed = manifestHash(manifest, plan.ignored);
  if (entry.hash !== undefined && entry.hash.toLowerCase() !== computed) {
    throw new LocalizedError("err.manifestMismatch", { name });
  }

  const folderLink = entry["hash-folder"];
  const baseUrl = folderLink !== undefined ? String(folderLink).replace(/\/*$/, "/") : undefined;
  const steamGame = source !== "remote" ? await context.steam() : null;
  if (source !== "remote" && !steamGame) {
    throw new GameSourceError(source === "depot" ? "err.depotRequired" : "err.steamMissing", { name }, "missing", {
      expectedBuild: entry.buildid,
    });
  }
  const mismatched: string[] = [];
  fs.mkdirSync(entryDir, { recursive: true });

  const wanted = Object.entries(manifest)
    .map(([file, hash]) => [normalizeRelative(file), hash.toLowerCase()] as const)
    .filter(([file]) => !matchesAny(file, plan.ignored));

  // Fichiers à récupérer : absents ou différents (et pas conservés).
  // La vérification des fichiers déjà présents (plusieurs Go) a sa propre progression, en octets.
  const toFetch: (readonly [string, string])[] = [];
  const existing = wanted.map(([file]) => resolveInside(entryDir, file)).map((destination) => {
    try {
      return fs.statSync(destination).size;
    } catch {
      return 0;
    }
  });
  const verifyTotal = existing.reduce((sum, size) => sum + size, 0);
  const verifyStartedAt = Date.now();
  let verified = 0;
  for (const [index, item] of wanted.entries()) {
    const [file, expected] = item;
    const destination = resolveInside(entryDir, file);
    const exists = existing[index] > 0 || fs.existsSync(destination);
    if (exists && (await hashes.hash(destination)) === expected) {
      verified += existing[index];
      if (verifyTotal > 0) context.report("verify", context.t("progress.verify", { label: name }), progressOf(verified, verifyTotal, verifyStartedAt));
      continue;
    }
    verified += existing[index];
    if (shouldWriteFile(file, plan, exists)) toFetch.push(item);
  }

  // Un fichier vérifié rejoint le dossier de préparation ; la bascule dans l'entrée se fait à la fin.
  const stage = path.join(tempDir, `${name}.stage`);
  fs.rmSync(stage, { recursive: true, force: true });
  const expectedByFile = new Map(toFetch);
  const stageVerified = (file: string, partial: string): void => stageFile(partial, stage, file);

  // Installation complète : une archive vaut mieux que des centaines de petits fichiers.
  const zipUrl = entry.zip;
  let unzipped: string | undefined;
  if (zipUrl !== undefined && toFetch.length > 0 && toFetch.length > wanted.length * ZIP_MIN_RATIO) {
    unzipped = await extractFromZip(context, zipUrl, new Set(toFetch.map(([file]) => file)));
  }

  // Steam / depot : AVANT toute copie, chaque fichier du joueur est vérifié par son hash. Un fichier invalide (autre version)
  // est repris dans `hash-folder` s'il est déclaré ; sinon l'installation s'arrête tout de suite avec la
  // liste des fichiers en cause (rien n'est copié pour rien).
  const steamUsable = new Set<string>();
  const throwVersionMismatch = (): never => {
    // `build` : texte traduit à la construction du message (fr par défaut), voir `GameSourceError`.
    throw new GameSourceError(
      entry.buildid === undefined ? "err.versionMismatch" : steamGame?.buildId ? "err.versionMismatchBuild" : "err.versionMismatchBuildUnknown",
      {
        name,
        count: mismatched.length,
        files: mismatched.slice(0, 3).join(", "),
        expected: String(entry.buildid ?? ""),
        installed: steamGame?.buildId ?? "",
      },
      "version",
      { expectedBuild: entry.buildid, installedBuild: steamGame?.buildId, files: mismatched.slice(0, 3), chosenFolder: steamGame?.chosen },
    );
  };
  if (steamGame) {
    const candidates = toFetch.filter(([file]) => !(unzipped && fs.existsSync(path.join(unzipped, file))));
    const sizes = candidates.map(([file]) => {
      try {
        return fs.statSync(path.join(steamGame.dir, ...file.split("/"))).size;
      } catch {
        return 0;
      }
    });
    const checkTotal = sizes.reduce((sum, size) => sum + size, 0);
    const checkStartedAt = Date.now();
    let checked = 0;
    context.report("verify", context.t("progress.checkSource", { label: name }));
    for (const [index, [file, expected]] of candidates.entries()) {
      signal?.throwIfAborted();
      const fromSteam = path.join(steamGame.dir, ...file.split("/"));
      if (sizes[index] > 0 && (await hashFile(fromSteam)) === expected) steamUsable.add(file);
      else if (baseUrl === undefined) mismatched.push(file); // rien d'autre pour fournir ce fichier
      checked += sizes[index];
      if (checkTotal > 0) context.report("verify", context.t("progress.checkSource", { label: name }), progressOf(checked, checkTotal, checkStartedAt));
    }
    if (mismatched.length > 0) throwVersionMismatch();
  }

  // Progression globale (tous les fichiers à récupérer) : un pourcentage, pas de nom de fichier.
  // Le téléchargement compte pour 90 % d'un fichier, la vérification pour 10 %.
  // Libellé fidèle à l'opération : copie depuis Steam (source locale) ou téléchargement
  const transferKey = source === "remote" ? "progress.download" : "progress.copy";
  const progress = createGlobalProgress(
    (transfer) => context.report("download", context.t(transferKey, { label: name }), transfer),
    () => toFetch.length,
  );
  // Mesure des tailles (requêtes HEAD, fichiers locaux) : c'est une analyse, pas encore un transfert
  context.report("verify", context.t("progress.scan", { label: name }));

  // Tailles connues d'avance pour un vrai pourcentage et un total : fichier local (archive extraite, copie Steam)
  // sinon taille distante (requête HEAD, tolérante : une taille inconnue est estimée à la moyenne des autres).
  const sizeOfLocal = (file: string): number | undefined => {
    for (const base of [unzipped, steamGame?.dir]) {
      if (!base) continue;
      try {
        return fs.statSync(path.join(base, ...file.split("/"))).size;
      } catch {
        /* pas dans cette source */
      }
    }
    return undefined;
  };
  const remoteSizes: string[] = [];
  for (const [file] of toFetch) {
    const local = sizeOfLocal(file);
    if (local !== undefined) progress.expect(file, local);
    else remoteSizes.push(file);
  }
  if (baseUrl !== undefined && io.size) {
    await runPool(remoteSizes, SIZE_CONCURRENCY, async (file) => {
      const size = await io.size?.(resolver.urlOf(baseUrl + encodePath(file)), signal);
      if (size !== undefined) progress.expect(file, size);
    });
  }
  progress.lock(); // le total ne bouge plus pendant le téléchargement
  context.report("download", context.t(transferKey, { label: name }));
  progress.emit();

  await runPool(toFetch, DOWNLOAD_CONCURRENCY, async ([file, expected]) => {
    // Nom stable (hash du chemin) : un téléchargement interrompu est repris à la synchro suivante.
    const partial = path.join(tempDir, `${name}.${createHash("sha1").update(file).digest("hex").slice(0, 12)}.part`);

    const fromZip = unzipped ? path.join(unzipped, file) : undefined;
    if (fromZip && fs.existsSync(fromZip) && (await hashFile(fromZip)) === expected) {
      const size = fs.statSync(fromZip).size;
      stageVerified(file, fromZip);
      progress.skip(size, file);
      return;
    }

    // Steam : copie du fichier du joueur, déjà vérifié avant le début des copies (le dossier Steam n'est jamais modifié).
    if (steamGame && steamUsable.has(file)) {
      const fromSteam = path.join(steamGame.dir, ...file.split("/"));
      // Copie par flux : la progression avance aussi pendant un fichier de plusieurs Go
      const size = fs.statSync(fromSteam).size;
      let copied = 0;
      await copyFileWithProgress(fromSteam, partial, (bytes) => {
        copied += bytes;
        progress.update(file, size > 0 ? (copied / size) * 0.9 : 0.9, copied);
      });
      stageVerified(file, partial);
      progress.finish(file, size);
      return;
    }
    if (baseUrl === undefined) throw new LocalizedError("err.hashFolderMissing", { name, file });

    let bytes = 0;
    await io.download(resolver.urlOf(baseUrl + encodePath(file)), partial, signal, (transfer) => {
      bytes = transfer.processed ?? bytes;
      if (transfer.total) progress.expect(file, transfer.total);
      progress.update(file, (transfer.percent / 100) * 0.9, bytes);
    });

    progress.update(file, 0.9, bytes);
    if ((await hashFile(partial)) !== expected) {
      fs.rmSync(partial, { force: true });
      throw new LocalizedError("err.hashInvalid", { name, file });
    }
    stageVerified(file, partial);
    progress.finish(file, bytes);
  });

  if (unzipped) fs.rmSync(unzipped, { recursive: true, force: true });

  // Tout est prêt et vérifié : bascule.
  beforeCommit();
  commitStaged(stage, entryDir, (relative, destination) => {
    const expected = expectedByFile.get(relative);
    if (expected) hashes.remember(destination, expected);
  });
  return { hash: computed };
};

export const hashProvider: Provider = createHashProvider("remote");
export const steamLibraryProvider: Provider = createHashProvider("steam");
/** `depot_steam` : même vérification que `steam_library`, mais le jeu vient uniquement de DepotDownloader. */
export const depotSteamProvider: Provider = createHashProvider("depot");
