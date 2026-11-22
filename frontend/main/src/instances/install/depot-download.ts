/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Télécharge la version exacte d'un jeu Steam (depot + manifeste) avec DepotDownloader,
 * connexion par QR code, dans `<installation>/.depot/game`. Les fichiers sont ensuite copiés
 * dans l'instance par `steam_library`, qui vérifie chacun par son hash : on ne fait pas confiance
 * à ce dossier. Sécurité : valeurs numériques validées, arguments en tableau, sortie forcée dans
 * l'installation, aucun mot de passe transmis.
 */

import fs from "fs";
import path from "path";

import type { DepotOptions } from "@shared/types";

import { DEPOT_DIR } from "./game-source.js";
import { parseDepotPercent, type DepotRunner } from "./depot-runner.js";

export interface DepotDownloadInput {
  tool: string;
  runner: DepotRunner;
  appId: number;
  depot: DepotOptions;
  installDir: string;
  /** `windows` | `linux` | `macos` */
  os: "windows" | "linux" | "macos";
  signal?: AbortSignal;
  onLine?: (line: string) => void;
  onPercent?: (percent: number) => void;
}

const DIGITS = /^\d{1,20}$/;

export const depotOsOf = (platform: string): "windows" | "linux" | "macos" =>
  platform === "win32" ? "windows" : platform === "darwin" ? "macos" : "linux";

/** Arguments validés ; lève si une valeur n'est pas numérique. */
export const buildDepotArgs = (appId: number, depot: DepotOptions, outDir: string, os: string): string[] => {
  if (!Number.isInteger(appId) || appId <= 0) throw new Error("DepotDownloader : appId invalide");
  if (!DIGITS.test(String(depot.id))) throw new Error("DepotDownloader : identifiant de depot invalide");
  if (!DIGITS.test(String(depot.manifest))) throw new Error("DepotDownloader : identifiant de manifeste invalide");
  return [
    "-app", String(appId),
    "-depot", String(depot.id),
    "-manifest", String(depot.manifest),
    "-os", os,
    "-dir", outDir,
    "-qr", // connexion par QR code (application mobile Steam) : aucun mot de passe saisi ici
    "-max-downloads", "8",
  ];
};

/** Retourne le dossier du jeu téléchargé. */
export const downloadWithDepot = async (input: DepotDownloadInput): Promise<string> => {
  const root = path.join(input.installDir, DEPOT_DIR);
  const outDir = path.join(root, "game");
  fs.mkdirSync(outDir, { recursive: true });
  const args = buildDepotArgs(input.appId, input.depot, outDir, input.os);

  const code = await input.runner(input.tool, args, {
    cwd: root,
    signal: input.signal,
    onLine: (line) => {
      input.onLine?.(line);
      const percent = parseDepotPercent(line);
      if (percent !== undefined) input.onPercent?.(percent);
    },
  });
  if (input.signal?.aborted) throw new Error("Téléchargement annulé");
  if (code !== 0) {
    throw new Error(`DepotDownloader a échoué (code ${code}) : connexion refusée, jeu absent du compte ou manifeste invalide`);
  }
  return outDir;
};
