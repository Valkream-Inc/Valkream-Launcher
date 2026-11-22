/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Génération de `depot-config.ts` à partir d'une release officielle de DepotDownloader
 * (utilisé par `yarn depot:pin <tag>`) : une entrée par plateforme reconnue, avec le sha256
 * CALCULÉ sur le zip téléchargé. Aucun hash n'est écrit sans avoir été calculé.
 */

import type { DepotAsset } from "./depot-config.js";

export interface ReleaseAsset {
  name: string;
  url: string;
}

const OS: Record<string, string> = { windows: "win32", linux: "linux", macos: "darwin" };

/** `DepotDownloader-windows-x64.zip` → `{ key: "win32-x64", file: "DepotDownloader.exe" }`, sinon `undefined`. */
export const platformOfAsset = (name: string): { key: string; file: string } | undefined => {
  const match = /^DepotDownloader-(windows|linux|macos)-(x64|arm64|arm)\.zip$/i.exec(name);
  if (!match) return undefined;
  const os = OS[match[1].toLowerCase()];
  return { key: `${os}-${match[2].toLowerCase()}`, file: os === "win32" ? "DepotDownloader.exe" : "DepotDownloader" };
};

export const renderDepotConfig = (version: string, assets: Record<string, DepotAsset>): string => {
  const rows = Object.entries(assets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, asset]) => `  "${key}": ${JSON.stringify(asset)},`)
    .join("\n");
  return `/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * GÉNÉRÉ par \`yarn depot:pin\` : DepotDownloader (SteamRE, GPL-2.0, https://github.com/SteamRE/DepotDownloader),
 * binaire officiel épinglé par version + sha256 (calculé sur le zip téléchargé).
 * Pour changer de version : \`yarn depot:pin <tag>\` puis publier le launcher. Au premier usage suivant,
 * la nouvelle version est téléchargée, vérifiée, et les anciennes supprimées.
 */

export interface DepotAsset {
  /** URL du zip de la release officielle. */
  url: string;
  /** sha256 du zip (hexadécimal). */
  sha256: string;
  /** Exécutable dans le zip. */
  file: string;
}

/** Clé : \`<os.platform()>-<os.arch()>\`, ex : \`win32-x64\`, \`linux-x64\`, \`darwin-arm64\`. */
export const DEPOT_DOWNLOADER_VERSION = ${JSON.stringify(version)};
export const DEPOT_DOWNLOADER_ASSETS: Record<string, DepotAsset> = {
${rows}
};
`;
};
