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

import { type ErrorVars, LocalizedError } from "../../lib/errors/localized-error.js";
import type { MessageKey } from "../../lib/errors/messages.js";

export const SOURCE_FILE = "instance.source.json";
/** Dossier (dans l'installation) où DepotDownloader dépose le jeu avant la copie vérifiée. */
export const DEPOT_DIR = ".depot";

export class GameSourceError extends LocalizedError {
  constructor(
    key: MessageKey,
    vars: ErrorVars,
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
    super(key, vars);
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

export type GuideLanguage = "fr" | "en";

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
  /** Langue du mode d'emploi (défaut : français). */
  language?: GuideLanguage;
}

const TEXT = {
  fr: {
    missingTitle: (entry: string) => `## Jeu introuvable pour « ${entry} »`,
    versionTitle: (entry: string) => `## Version du jeu différente pour « ${entry} »`,
    missing:
      "Le launcher n'a pas trouvé le jeu dans votre bibliothèque Steam. Il ne contient pas les fichiers du jeu (propriété de son éditeur) : il copie ceux de **votre** installation.",
    version: (build: string, files: string) =>
      `Les fichiers du jeu ne correspondent pas à la version attendue${build}.${files}`,
    build: (expected: string | number, installed?: string) =>
      ` (build **${expected}**${installed ? `, installé : **${installed}**` : ""})`,
    files: (list: string) => ` Par exemple : \`${list}\`.`,
    chosen: "_Le dossier utilisé est celui que vous avez indiqué._",
    s1: "### Solution 1 — installer la bonne version dans Steam",
    openLibrary: "1. Ouvrez Steam → **Bibliothèque**.",
    install: "2. Installez le jeu (il doit être dans votre compte).",
    props: "1. Steam → **Bibliothèque** → clic droit sur le jeu → **Propriétés**.",
    beta: (branch: string) => `2. Onglet **Bêtas** → choisissez la branche **${branch}**.`,
    betaAny: "2. Onglet **Bêtas** → choisissez la branche qui correspond à la version demandée.",
    wait: "3. Laissez Steam finir la mise à jour (le jeu doit afficher « À jour »).",
    back: (n: number) => `${n}. Revenez ici et relancez l'installation.`,
    page: (id: number) => `Page Steam du jeu : steam://nav/games/details/${id}`,
    s2: "### Solution 2 — indiquer le dossier d'une installation",
    s2text:
      "Si le jeu est installé ailleurs (autre disque, copie, version non Steam…), choisissez son dossier. Seuls les fichiers attendus sont copiés, après vérification : les fichiers en plus (BepInEx, mods, sauvegardes) sont ignorés et jamais modifiés.",
    s3: "### Solution 3 — télécharger la version exacte (DepotDownloader)",
    s3text:
      "Le launcher peut télécharger cette version directement depuis Steam avec l'outil open source DepotDownloader. Vous vous connectez en **scannant un QR code** avec l'application mobile Steam : le launcher ne voit jamais votre mot de passe. Le jeu doit appartenir à votre compte.",
  },
  en: {
    missingTitle: (entry: string) => `## Game not found for “${entry}”`,
    versionTitle: (entry: string) => `## Different game version for “${entry}”`,
    missing:
      "The launcher did not find the game in your Steam library. It does not contain the game files (owned by their publisher): it copies those of **your** installation.",
    version: (build: string, files: string) => `The game files do not match the expected version${build}.${files}`,
    build: (expected: string | number, installed?: string) =>
      ` (build **${expected}**${installed ? `, installed: **${installed}**` : ""})`,
    files: (list: string) => ` For example: \`${list}\`.`,
    chosen: "_The folder used is the one you selected._",
    s1: "### Solution 1 — install the right version in Steam",
    openLibrary: "1. Open Steam → **Library**.",
    install: "2. Install the game (it must be in your account).",
    props: "1. Steam → **Library** → right-click the game → **Properties**.",
    beta: (branch: string) => `2. **Betas** tab → choose the **${branch}** branch.`,
    betaAny: "2. **Betas** tab → choose the branch that matches the requested version.",
    wait: "3. Let Steam finish updating (the game must show “Up to date”).",
    back: (n: number) => `${n}. Come back here and restart the installation.`,
    page: (id: number) => `Game page on Steam: steam://nav/games/details/${id}`,
    s2: "### Solution 2 — point to an existing installation",
    s2text:
      "If the game is installed elsewhere (another drive, a copy, a non-Steam version…), choose its folder. Only the expected files are copied, after verification: extra files (BepInEx, mods, saves) are ignored and never modified.",
    s3: "### Solution 3 — download the exact version (DepotDownloader)",
    s3text:
      "The launcher can download this version straight from Steam with the open source tool DepotDownloader. You sign in by **scanning a QR code** with the Steam mobile app: the launcher never sees your password. The game must belong to your account.",
  },
} as const;

/** Mode d'emploi Markdown affiché au joueur. */
export const buildSteamGuide = (input: GuideInput): string => {
  const { issue, appId, branch, expectedBuild, installedBuild, files = [], chosenFolder, depotAvailable } = input;
  const text = TEXT[input.language ?? "fr"];
  const lines: string[] = [];

  lines.push(issue === "missing" ? text.missingTitle(input.entry) : text.versionTitle(input.entry), "");
  lines.push(
    issue === "missing"
      ? text.missing
      : text.version(
          expectedBuild !== undefined ? text.build(expectedBuild, installedBuild) : "",
          files.length > 0 ? text.files(files.slice(0, 3).join("`, `")) : "",
        ),
  );
  if (chosenFolder) lines.push("", text.chosen);
  lines.push("", text.s1, "");
  if (issue === "missing") {
    lines.push(text.openLibrary, text.install);
  } else {
    lines.push(text.props, branch ? text.beta(branch) : text.betaAny, text.wait);
  }
  lines.push(text.back(issue === "missing" ? 3 : 4));
  if (appId !== undefined) lines.push("", text.page(appId));

  lines.push("", text.s2, "", text.s2text);
  if (depotAvailable) lines.push("", text.s3, "", text.s3text);
  return lines.join("\n");
};

/** Informations envoyées à l'interface pour proposer les solutions. */
export const toSteamSourceIssue = (error: GameSourceError, input: Omit<GuideInput, "issue" | "expectedBuild" | "installedBuild" | "files" | "chosenFolder">): SteamSourceIssue => ({
  issue: error.issue,
  guide: buildSteamGuide({ ...input, issue: error.issue, ...error.details }),
  depotAvailable: input.depotAvailable,
});
