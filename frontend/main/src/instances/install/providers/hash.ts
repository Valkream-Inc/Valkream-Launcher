/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * `hash_url` : l'entrée est un manifeste `{ fichier: sha256 }`. Seuls les fichiers
 * absents ou différents sont récupérés ; chacun est vérifié avant d'être mis en place.
 * `zip` (optionnel) : archive de tous les fichiers. Quand plus de la moitié des fichiers
 * est à récupérer (installation complète), elle est téléchargée en une fois ; les fichiers
 * absents de l'archive ou au mauvais hash sont repris un par un via `hash-folder`.
 * `to_ignore` : jamais vérifié ni touché. Fichiers conservés : gardés s'ils existent.
 * Les hash du disque passent par le cache de l'installation (`HashCache`).
 */

import fs from "fs";
import path from "path";

import { hashFile, manifestHash, type Manifest } from "../manifest";
import { resolveInside } from "../../../lib/paths";
import { matchesAny, normalizeRelative } from "../../../lib/patterns";
import { shouldWriteFile } from "../preserve";
import type { Provider, ProviderContext } from "./types";

/** Part de fichiers à récupérer au-delà de laquelle on préfère l'archive aux fichiers un par un. */
const ZIP_MIN_RATIO = 0.5;

const encodePath = (relative: string): string =>
  relative.split("/").map(encodeURIComponent).join("/");

/** Télécharge l'archive et en extrait seulement `files` ; retourne le dossier d'extraction. */
const extractFromZip = async (
  context: ProviderContext,
  zipUrl: string,
  files: ReadonlySet<string>,
): Promise<string> => {
  const { entry, tempDir, resolver, io, name, signal } = context;
  const zipPath = path.join(tempDir, `${name}.zip`);
  const extractDir = path.join(tempDir, `${name}.unzipped`);

  context.report("download", `${name} : archive`);
  await io.download(resolver.urlOf(zipUrl), zipPath, signal, (transfer) =>
    context.report("download", `${name} : archive`, transfer),
  );

  context.report("extract", `${name} : extraction`);
  fs.mkdirSync(extractDir, { recursive: true });
  await io.extract(zipPath, extractDir, {
    folderInZip: entry.folder_in_zip,
    accept: (relative) => files.has(relative),
  });
  fs.rmSync(zipPath, { force: true });
  return extractDir;
};

export const hashProvider: Provider = async (context) => {
  const { entry, entryDir, tempDir, plan, platform, resolver, io, hashes, name, signal } = context;

  const content = entry.content;
  if (content === undefined || Array.isArray(content)) {
    throw new Error(`${name} : manifeste de hash absent pour la plateforme ${platform}`);
  }
  const { value: manifest } = await resolver.getJson<Manifest>(content as string | Manifest);

  // Intégrité du manifeste lui-même : le hash déclaré par le latest.yml fait foi.
  const computed = manifestHash(manifest, plan.ignored);
  if (entry.hash !== undefined && entry.hash.toLowerCase() !== computed) {
    throw new Error(`${name} : le manifeste ne correspond pas au hash déclaré`);
  }

  const baseUrl = String(entry["hash-folder"]).replace(/\/*$/, "/");
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

  // Un fichier vérifié est mis en place, puis son hash est mémorisé.
  const install = (file: string, partial: string, expected: string): void => {
    const destination = resolveInside(entryDir, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(partial, destination);
    fs.rmSync(partial, { force: true });
    hashes.remember(destination, expected);
  };

  // Installation complète : une archive vaut mieux que des centaines de petits fichiers.
  const zipUrl = entry.zip;
  let unzipped: string | undefined;
  if (zipUrl !== undefined && toFetch.length > 0 && toFetch.length > wanted.length * ZIP_MIN_RATIO) {
    unzipped = await extractFromZip(context, zipUrl, new Set(toFetch.map(([file]) => file)));
  }

  let done = wanted.length - toFetch.length;
  for (const [file, expected] of toFetch) {
    done++;
    const partial = path.join(tempDir, `${name}.part`);

    const fromZip = unzipped ? path.join(unzipped, file) : undefined;
    if (fromZip && fs.existsSync(fromZip) && (await hashFile(fromZip)) === expected) {
      install(file, fromZip, expected);
      continue;
    }

    context.report("download", `${name} : ${file} (${done}/${wanted.length})`);
    await io.download(resolver.urlOf(baseUrl + encodePath(file)), partial, signal, (transfer) =>
      context.report("download", `${name} : ${file} (${done}/${wanted.length})`, transfer),
    );

    context.report("verify", `${name} : vérification de ${file}`);
    if ((await hashFile(partial)) !== expected) {
      fs.rmSync(partial, { force: true });
      throw new Error(`${name} : hash invalide pour ${file}`);
    }
    install(file, partial, expected);
  }

  if (unzipped) fs.rmSync(unzipped, { recursive: true, force: true });
  return { hash: computed };
};
