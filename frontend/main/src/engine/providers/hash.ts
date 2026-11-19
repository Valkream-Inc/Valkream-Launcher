/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * `hash_url` : l'entrée est un manifeste `{ fichier: sha256 }`. Seuls les fichiers
 * absents ou différents sont téléchargés ; chacun est vérifié avant d'être mis en place.
 * `to_ignore` : jamais vérifié ni touché. Fichiers conservés : gardés s'ils existent.
 */

import fs from "fs";
import path from "path";

import { hashFile, manifestHash, type Manifest } from "../manifest";
import { resolveInside } from "../paths";
import { matchesAny, normalizeRelative } from "../patterns";
import { shouldWriteFile } from "../preserve";
import type { Provider } from "./types";

const encodePath = (relative: string): string =>
  relative.split("/").map(encodeURIComponent).join("/");

export const hashProvider: Provider = async (context) => {
  const { entry, entryDir, tempDir, plan, platform, resolver, io, name, signal } = context;

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

  let done = 0;
  for (const [file, expected] of wanted) {
    const destination = resolveInside(entryDir, file);
    const exists = fs.existsSync(destination);
    if (exists && (await hashFile(destination)) === expected) {
      done++;
      continue;
    }
    if (!shouldWriteFile(file, plan, exists)) {
      done++;
      continue;
    }

    context.report("download", `${name} : ${file} (${++done}/${wanted.length})`);
    const partial = path.join(tempDir, `${name}.part`);
    await io.download(resolver.urlOf(baseUrl + encodePath(file)), partial, signal, (transfer) =>
      context.report("download", `${name} : ${file} (${done}/${wanted.length})`, transfer),
    );

    context.report("verify", `${name} : vérification de ${file}`);
    if ((await hashFile(partial)) !== expected) {
      fs.rmSync(partial, { force: true });
      throw new Error(`${name} : hash invalide pour ${file}`);
    }
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(partial, destination);
    fs.rmSync(partial, { force: true });
  }

  return { hash: computed };
};
