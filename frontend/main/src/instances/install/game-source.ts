/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Source du jeu pour `steam_library` quand l'installation Steam du joueur ne convient pas
 * (jeu absent ou autre version). Trois solutions sont proposées au joueur :
 * 1. suivre un mode d'emploi (Markdown, `buildSteamGuide`) pour installer la bonne version ;
 * 2. indiquer lui-même le dossier d'une installation (`instance.source.json`) ;
 * 3. télécharger la version exacte avec DepotDownloader (voir `depot-download.ts`).
 * Dans tous les cas, seuls les fichiers du manifeste sont copiés, chacun vérifié par son hash :
 * les fichiers parasites du dossier source (BepInEx déjà installé, mods, saves…) sont ignorés.
 */

import fs from "fs";
import path from "path";

import type { SteamSourceIssue } from "@shared/types";

export const SOURCE_FILE = "instance.source.json";
/** Dossier (dans l'installation) où DepotDownloader dépose le jeu avant la copie vérifiée. */
export const DEPOT_DIR = ".depot";

export class GameSourceError extends Error {
  constructor(
    message: string,
    readonly issue: "missing" | "version",
    readonly details: {
      expectedBuild?: string | number;
      installedBuild?: string;
      /** Exemples de fichiers absents ou différents. */
      files?: string[];
      /** Le dossier vient d'un choix du joueur (et non de la bibliothèque Steam). */
      chosenFolder?: boolean;
    } = {},
  ) {
    super(message);
    this.name = "GameSourceError";
  }
}

/** Dossier de jeu choisi par le joueur (ou téléchargé par DepotDownloader), s'il existe encore. */
export const readGameSourceDir = (installDir: string): string | undefined => {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(installDir, SOURCE_FILE), "utf8")) as { dir?: unknown };
    return typeof raw.dir === "string" && raw.dir !== "" && fs.existsSync(raw.dir) ? raw.dir : undefined;
  } catch {
    return undefined;
  }
};

export const writeGameSourceDir = (installDir: string, dir: string): void => {
  fs.mkdirSync(installDir, { recursive: true });
  const file = path.join(installDir, SOURCE_FILE);
  fs.writeFileSync(`${file}.tmp`, JSON.stringify({ dir }, null, 2));
  fs.renameSync(`${file}.tmp`, file);
};

export const clearGameSourceDir = (installDir: string): void => {
  fs.rmSync(path.join(installDir, SOURCE_FILE), { force: true });
};

export interface GuideInput {
  entry: string;
  issue: "missing" | "version";
  appId?: number;
  /** Nom de la branche bêta Steam à choisir (option `steam-beta` de l'entrée). */
  branch?: string;
  expectedBuild?: string | number;
  installedBuild?: string;
  files?: string[];
  chosenFolder?: boolean;
  depotAvailable: boolean;
}

/** Mode d'emploi Markdown affiché au joueur. */
export const buildSteamGuide = (input: GuideInput): string => {
  const { issue, appId, branch, expectedBuild, installedBuild, files = [], chosenFolder, depotAvailable } = input;
  const lines: string[] = [];

  lines.push(
    issue === "missing"
      ? `## Jeu introuvable pour « ${input.entry} »`
      : `## Version du jeu différente pour « ${input.entry} »`,
  );
  lines.push("");
  lines.push(
    issue === "missing"
      ? "Le launcher n'a pas trouvé le jeu dans votre bibliothèque Steam. Il ne contient pas les fichiers du jeu (propriété de son éditeur) : il copie ceux de **votre** installation."
      : `Les fichiers du jeu ne correspondent pas à la version attendue${expectedBuild !== undefined ? ` (build **${expectedBuild}**` + (installedBuild ? `, installé : **${installedBuild}**` : "") + ")" : ""}.` +
          (files.length > 0 ? ` Par exemple : \`${files.slice(0, 3).join("`, `")}\`.` : ""),
  );
  if (chosenFolder) lines.push("", "_Le dossier utilisé est celui que vous avez indiqué._");
  lines.push("", "### Solution 1 — installer la bonne version dans Steam", "");
  if (issue === "missing") {
    lines.push("1. Ouvrez Steam → **Bibliothèque**.", "2. Installez le jeu (il doit être dans votre compte).");
  } else {
    lines.push("1. Steam → **Bibliothèque** → clic droit sur le jeu → **Propriétés**.");
    lines.push(
      branch
        ? `2. Onglet **Bêtas** → choisissez la branche **${branch}**.`
        : "2. Onglet **Bêtas** → choisissez la branche qui correspond à la version demandée.",
    );
    lines.push("3. Laissez Steam finir la mise à jour (le jeu doit afficher « À jour »).");
  }
  lines.push(`${issue === "missing" ? "3" : "4"}. Revenez ici et relancez l'installation.`);
  if (appId !== undefined) lines.push("", `Page Steam du jeu : steam://nav/games/details/${appId}`);

  lines.push("", "### Solution 2 — indiquer le dossier d'une installation", "");
  lines.push(
    "Si le jeu est installé ailleurs (autre disque, copie, version non Steam…), choisissez son dossier. " +
      "Seuls les fichiers attendus sont copiés, après vérification : les fichiers en plus (BepInEx, mods, sauvegardes) sont ignorés et jamais modifiés.",
  );

  if (depotAvailable) {
    lines.push("", "### Solution 3 — télécharger la version exacte (DepotDownloader)", "");
    lines.push(
      "Le launcher peut télécharger cette version directement depuis Steam avec l'outil open source DepotDownloader. " +
        "Vous vous connectez en **scannant un QR code** avec l'application mobile Steam : le launcher ne voit jamais votre mot de passe. " +
        "Le jeu doit appartenir à votre compte.",
    );
  }
  return lines.join("\n");
};

/** Informations envoyées à l'interface pour proposer les solutions. */
export const toSteamSourceIssue = (error: GameSourceError, input: Omit<GuideInput, "issue" | "expectedBuild" | "installedBuild" | "files" | "chosenFolder">): SteamSourceIssue => ({
  issue: error.issue,
  guide: buildSteamGuide({ ...input, issue: error.issue, ...error.details }),
  depotAvailable: input.depotAvailable,
});
