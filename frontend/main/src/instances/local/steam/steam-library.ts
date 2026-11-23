/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Retrouve un jeu installé par le joueur dans sa bibliothèque Steam (sans identifiant Steam,
 * en lisant seulement les fichiers de Steam) : dossier du jeu et `buildid` installé.
 *   <steam>/steamapps/libraryfolders.vdf        → bibliothèques
 *   <bibliothèque>/steamapps/appmanifest_<id>.acf → installdir + buildid
 *   <bibliothèque>/steamapps/common/<installdir>  → fichiers du jeu
 */

import { execFile } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import type { GamePlatform } from "@shared/types";

import { parseVdf, type VdfValue } from "../../../lib/format/vdf.js";

const run = promisify(execFile);

export interface SteamGame {
  /** Dossier du jeu dans la bibliothèque Steam (lecture seule : le launcher n'y écrit jamais). */
  dir: string;
  /** `buildid` Steam installé (identifie la version du jeu). */
  buildId: string;
  /** Dossier indiqué par le joueur (ou téléchargé par DepotDownloader), pas celui de Steam. */
  chosen?: boolean;
}

export interface SteamLocateDeps {
  platform: GamePlatform;
  home: string;
  env: Record<string, string | undefined>;
  exists: (file: string) => boolean;
  readFile: (file: string) => string;
  /** Chemin d'installation de Steam lu dans le registre Windows. */
  registrySteamPath: () => Promise<string | undefined>;
}

const readRegistrySteamPath = async (): Promise<string | undefined> => {
  try {
    const { stdout } = await run("reg", ["query", "HKCU\\Software\\Valve\\Steam", "/v", "SteamPath"]);
    return /SteamPath\s+REG_SZ\s+(.+)/i.exec(stdout)?.[1]?.trim();
  } catch {
    return undefined;
  }
};

export const realLocateDeps = (): SteamLocateDeps => ({
  platform: process.platform as GamePlatform,
  home: os.homedir(),
  env: process.env,
  exists: fs.existsSync,
  readFile: (file) => fs.readFileSync(file, "utf8"),
  registrySteamPath: readRegistrySteamPath,
});

const steamRoots = async (deps: SteamLocateDeps): Promise<string[]> => {
  if (deps.platform === "win32") {
    const registry = await deps.registrySteamPath();
    return [
      ...(registry ? [registry] : []),
      path.join(deps.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)", "Steam"),
    ];
  }
  if (deps.platform === "darwin") return [path.join(deps.home, "Library", "Application Support", "Steam")];
  return [
    path.join(deps.home, ".steam", "steam"),
    path.join(deps.home, ".local", "share", "Steam"),
    path.join(deps.home, ".var", "app", "com.valvesoftware.Steam", ".local", "share", "Steam"),
  ];
};

const asBlock = (value: VdfValue | undefined): Record<string, VdfValue> =>
  value !== undefined && typeof value === "object" ? value : {};

/** Bibliothèques Steam : le dossier de Steam lui-même + celles de `libraryfolders.vdf`. */
const libraries = (root: string, deps: SteamLocateDeps): string[] => {
  const result = [root];
  const file = path.join(root, "steamapps", "libraryfolders.vdf");
  if (!deps.exists(file)) return result;
  try {
    const folders = asBlock(parseVdf(deps.readFile(file)).libraryfolders);
    for (const entry of Object.values(folders)) {
      // Format récent : { path: "…" } ; ancien format : "1" "chemin"
      const libraryPath = typeof entry === "string" ? entry : asBlock(entry).path;
      if (typeof libraryPath === "string" && libraryPath !== "") result.push(libraryPath);
    }
  } catch {
    /* fichier illisible : on garde la bibliothèque principale */
  }
  return result;
};

/** Le jeu installé par Steam, ou `null` (Steam absent, jeu non installé). */
export const locateSteamGame = async (
  appId: number,
  deps: SteamLocateDeps = realLocateDeps(),
): Promise<SteamGame | null> => {
  const seen = new Set<string>();
  for (const root of await steamRoots(deps)) {
    if (!deps.exists(root)) continue;
    for (const library of libraries(root, deps)) {
      const manifest = path.join(library, "steamapps", `appmanifest_${appId}.acf`);
      if (seen.has(manifest) || !deps.exists(manifest)) continue;
      seen.add(manifest);
      try {
        const state = asBlock(parseVdf(deps.readFile(manifest)).AppState);
        const installDir = state.installdir;
        if (typeof installDir !== "string" || installDir === "" || /[\\/]|^\.\.?$/.test(installDir)) continue;
        const dir = path.join(library, "steamapps", "common", installDir);
        if (deps.exists(dir)) return { dir, buildId: typeof state.buildid === "string" ? state.buildid : "" };
      } catch {
        /* manifeste illisible : bibliothèque suivante */
      }
    }
  }
  return null;
};
