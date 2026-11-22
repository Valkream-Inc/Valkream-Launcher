/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Prépare le binaire DepotDownloader : téléchargement de l'asset épinglé, vérification du sha256
 * AVANT toute extraction ou exécution, extraction dans `<racine>/tools/depotdownloader/<sha>/`.
 * Le hash de l'exécutable extrait est mémorisé et revérifié avant chaque lancement.
 */

import fs from "fs";
import path from "path";

import { hashFile } from "./manifest.js";
import type { InstallIO } from "./providers/types.js";
import type { DepotAsset } from "./depot-config.js";
import { LocalizedError } from "../../lib/localized-error.js";

export interface DepotToolOptions {
  /** Dossier des outils du launcher (`<racine>/tools`). */
  toolsDir: string;
  platformKey: string;
  assets: Record<string, DepotAsset>;
  io: Pick<InstallIO, "download" | "extract">;
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
}

const SHA256 = /^[0-9a-f]{64}$/;

/** DepotDownloader est-il configuré (url + sha256 valides) pour cette plateforme ? */
export const depotAssetFor = (assets: Record<string, DepotAsset>, platformKey: string): DepotAsset | undefined => {
  const asset = assets[platformKey];
  if (!asset || !asset.url.startsWith("https://") || !SHA256.test(asset.sha256.toLowerCase())) return undefined;
  if (asset.file === "" || path.isAbsolute(asset.file) || asset.file.split(/[\\/]/).includes("..")) return undefined;
  return asset;
};

/**
 * Mise à jour de l'outil : la version (et son sha256) est épinglée dans `depot-config.ts` et change avec
 * le launcher. Une nouvelle version est téléchargée et vérifiée automatiquement au premier usage ;
 * les anciennes versions et archives partielles sont alors supprimées.
 */
export const pruneOldVersions = (base: string, keep: string): void => {
  let names: string[];
  try {
    names = fs.readdirSync(base);
  } catch {
    return;
  }
  for (const name of names) if (name !== keep) fs.rmSync(path.join(base, name), { recursive: true, force: true });
};

/** Chemin de l'exécutable vérifié ; télécharge et extrait si nécessaire. */
export const ensureDepotDownloader = async ({
  toolsDir,
  platformKey,
  assets,
  io,
  signal,
  onProgress,
}: DepotToolOptions): Promise<string> => {
  const asset = depotAssetFor(assets, platformKey);
  if (!asset) {
    throw new LocalizedError("err.depotNotConfigured");
  }
  const sha = asset.sha256.toLowerCase();
  const base = path.join(toolsDir, "depotdownloader");
  const zipPath = path.join(base, `${sha}.zip`);
  const outDir = path.join(base, sha.slice(0, 16));
  const exe = path.join(outDir, ...asset.file.split(/[\\/]/));
  const marker = path.join(outDir, ".exe.sha256");

  // Déjà extrait : l'exécutable doit être celui dont on a mémorisé le hash.
  if (fs.existsSync(exe) && fs.existsSync(marker)) {
    if ((await hashFile(exe)) === fs.readFileSync(marker, "utf8").trim()) {
      pruneOldVersions(base, path.basename(outDir));
      return exe;
    }
    fs.rmSync(outDir, { recursive: true, force: true });
  }

  fs.mkdirSync(base, { recursive: true });
  await io.download(asset.url, zipPath, signal, (transfer) => onProgress?.(transfer.percent));
  if ((await hashFile(zipPath)) !== sha) {
    fs.rmSync(zipPath, { force: true });
    throw new LocalizedError("err.depotHash");
  }

  fs.rmSync(outDir, { recursive: true, force: true });
  await io.extract(zipPath, outDir, { accept: () => true });
  if (!fs.existsSync(exe)) throw new LocalizedError("err.depotExeMissing", { file: asset.file });
  if (process.platform !== "win32") fs.chmodSync(exe, 0o755);
  fs.writeFileSync(marker, await hashFile(exe));
  fs.rmSync(zipPath, { force: true });
  pruneOldVersions(base, path.basename(outDir));
  return exe;
};
