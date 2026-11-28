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

import type { DepotOptions, DepotStepName } from "@shared/types";

import { DEPOT_DIR } from "../game-source.js";
import { advanceDepotStep, classifyDepotFailure, parseDepotStep } from "./depot-output.js";
import { parseDepotPercent, type DepotRunner } from "./depot-runner.js";
import { LocalizedError } from "../../../lib/errors/localized-error.js";

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
  /** Étape détectée dans la sortie de l'outil (connexion, téléchargement, fin) ; appelée à chaque changement. */
  onStep?: (step: DepotStepName) => void;
}

const DIGITS = /^\d{1,20}$/;

export const depotOsOf = (platform: string): "windows" | "linux" | "macos" =>
  platform === "win32" ? "windows" : platform === "darwin" ? "macos" : "linux";

/** Arguments validés ; lève si une valeur n'est pas numérique. */
export const buildDepotArgs = (appId: number, depot: DepotOptions, outDir: string, os: string): string[] => {
  if (!Number.isInteger(appId) || appId <= 0) throw new LocalizedError("err.depotAppId");
  if (!DIGITS.test(String(depot.id))) throw new LocalizedError("err.depotId");
  if (!DIGITS.test(String(depot.manifest))) throw new LocalizedError("err.depotManifest");
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

  const recent: string[] = [];
  let step: DepotStepName | undefined;
  let code: number;
  try {
    code = await input.runner(input.tool, args, {
      cwd: root,
      signal: input.signal,
      onLine: (line) => {
        recent.push(line);
        if (recent.length > 80) recent.shift();
        input.onLine?.(line);
        const next = advanceDepotStep(step, parseDepotStep(line));
        if (next !== undefined) {
          step = next;
          input.onStep?.(next);
        }
        const percent = parseDepotPercent(line);
        if (percent !== undefined) input.onPercent?.(percent);
      },
    });
  } catch (error) {
    if (input.signal?.aborted) throw new LocalizedError("err.downloadCancelled");
    // L'outil n'a pas pu démarrer (antivirus, droits, fichier supprimé…)
    const reason = (error as NodeJS.ErrnoException).code ?? (error instanceof Error ? error.message : String(error));
    throw new LocalizedError("err.depotSpawn", { reason });
  }
  if (input.signal?.aborted) throw new LocalizedError("err.downloadCancelled");
  if (code !== 0) {
    const failure = classifyDepotFailure(recent);
    throw new LocalizedError(failure.key, { code, detail: failure.detail });
  }
  return outDir;
};
