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
 */

import fs from "fs";
import path from "path";

import { createHash } from "crypto";

import { hashFile, manifestHash, type Manifest } from "../manifest";
import { runPool } from "../../../lib/concurrency";
import { resolveInside } from "../../../lib/paths";
import { matchesAny, normalizeRelative } from "../../../lib/patterns";
import { shouldWriteFile } from "../preserve";
import { commitStaged, stageFile } from "../staging";
import { fetchArchive } from "./archive";
import { createGlobalProgress } from "./global-progress";
import type { Provider, ProviderContext } from "./types";

/** Téléchargements simultanés de fichiers individuels. */
const DOWNLOAD_CONCURRENCY = 4;

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

const createHashProvider = (source: "remote" | "steam"): Provider => async (context) => {
  const { entry, entryDir, tempDir, plan, platform, resolver, io, hashes, name, signal, beforeCommit } = context;

  const content = entry.content;
  if (content === undefined || Array.isArray(content)) {
    throw new Error(`${name} : manifeste de hash absent pour la plateforme ${platform}`);
  }
  const manifest = await context.loadContent<Manifest>();

  // Intégrité du manifeste lui-même : le hash déclaré par le latest.yml fait foi.
  const computed = manifestHash(manifest, plan.ignored);
  if (entry.hash !== undefined && entry.hash.toLowerCase() !== computed) {
    throw new Error(`${name} : le manifeste ne correspond pas au hash déclaré`);
  }

  const folderLink = entry["hash-folder"];
  const baseUrl = folderLink !== undefined ? String(folderLink).replace(/\/*$/, "/") : undefined;
  const steamGame = source === "steam" ? await context.steam() : null;
  if (source === "steam" && !steamGame) {
    throw new Error(`${name} : jeu introuvable dans Steam : installez-le (Steam → Bibliothèque) puis relancez`);
  }
  const mismatched: string[] = [];
  fs.mkdirSync(entryDir, { recursive: true });

  const wanted = Object.entries(manifest)
    .map(([file, hash]) => [normalizeRelative(file), hash.toLowerCase()] as const)
    .filter(([file]) => !matchesAny(file, plan.ignored));

  // Fichiers à récupérer : absents ou différents (et pas conservés).
  const toFetch: (readonly [string, string])[] = [];
  for (const item of wanted) {
    const [file, expected] = item;
    const destination = resolveInside(entryDir, file);
    const exists = fs.existsSync(destination);
    if (exists && (await hashes.hash(destination)) === expected) continue;
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

  // Progression globale (tous les fichiers à récupérer) : un pourcentage, pas de nom de fichier.
  // Le téléchargement compte pour 90 % d'un fichier, la vérification pour 10 %.
  const progress = createGlobalProgress(
    (transfer) => context.report("download", `${name} : téléchargement`, transfer),
    () => toFetch.length,
  );
  context.report("download", `${name} : téléchargement`);

  await runPool(toFetch, DOWNLOAD_CONCURRENCY, async ([file, expected]) => {
    // Nom stable (hash du chemin) : un téléchargement interrompu est repris à la synchro suivante.
    const partial = path.join(tempDir, `${name}.${createHash("sha1").update(file).digest("hex").slice(0, 12)}.part`);

    const fromZip = unzipped ? path.join(unzipped, file) : undefined;
    if (fromZip && fs.existsSync(fromZip) && (await hashFile(fromZip)) === expected) {
      stageVerified(file, fromZip);
      progress.skip();
      return;
    }

    // Steam : copie du fichier du joueur s'il a la bonne version (le dossier Steam n'est jamais modifié).
    if (steamGame) {
      const fromSteam = path.join(steamGame.dir, ...file.split("/"));
      if (fs.existsSync(fromSteam)) {
        if ((await hashFile(fromSteam)) === expected) {
          fs.copyFileSync(fromSteam, partial);
          stageVerified(file, partial);
          progress.skip();
          return;
        }
        if (baseUrl === undefined) {
          mismatched.push(file); // fichier du jeu d'une autre version, rien d'autre pour le fournir
          progress.skip();
          return;
        }
      } else if (baseUrl === undefined) {
        mismatched.push(file);
        progress.skip();
        return;
      }
    }
    if (baseUrl === undefined) throw new Error(`${name} : hash-folder absent pour ${file}`);

    let bytes = 0;
    await io.download(resolver.urlOf(baseUrl + encodePath(file)), partial, signal, (transfer) => {
      bytes = transfer.processed ?? bytes;
      progress.update(file, (transfer.percent / 100) * 0.9, bytes);
    });

    progress.update(file, 0.9, bytes);
    if ((await hashFile(partial)) !== expected) {
      fs.rmSync(partial, { force: true });
      throw new Error(`${name} : hash invalide pour ${file}`);
    }
    stageVerified(file, partial);
    progress.finish(file, bytes);
  });

  if (unzipped) fs.rmSync(unzipped, { recursive: true, force: true });

  if (mismatched.length > 0) {
    const expectedBuild = entry.buildid !== undefined ? ` (build attendu : ${entry.buildid}, installé : ${steamGame?.buildId || "inconnu"})` : "";
    throw new Error(
      `${name} : la version du jeu installée par Steam ne correspond pas${expectedBuild} : ${mismatched.length} fichier(s) différent(s) ou absent(s), ex : ${mismatched.slice(0, 3).join(", ")}. ` +
        "Dans Steam : clic droit sur le jeu → Propriétés → Bêtas, choisissez la version demandée, laissez Steam finir, puis relancez.",
    );
  }

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
