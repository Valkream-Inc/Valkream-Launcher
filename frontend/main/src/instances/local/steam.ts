/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Réglage `launchSteam` : s'assurer que Steam tourne avant de lancer le jeu, pour que la
 * vérification de possession du jeu fonctionne. Le jeu lui-même est lancé par le launcher.
 */

import { execFile } from "child_process";
import { promisify } from "util";

import type { GamePlatform } from "@shared/types";

const run = promisify(execFile);

export interface SteamDeps {
  isRunning(): Promise<boolean>;
  open(url: string): Promise<void>;
  sleep(ms: number): Promise<void>;
}

export interface SteamOptions {
  /** Attente maximale du démarrage de Steam (ms). */
  timeoutMs?: number;
  pollMs?: number;
  /** Délai laissé à Steam pour se connecter une fois le processus visible (ms). */
  settleMs?: number;
}

/**
 * Démarre Steam s'il ne tourne pas, puis attend qu'il soit prêt.
 * Ne bloque jamais le lancement : après le délai maximal, le jeu est lancé quand même.
 */
export const ensureSteamRunning = async (
  deps: SteamDeps,
  { timeoutMs = 30_000, pollMs = 1000, settleMs = 3000 }: SteamOptions = {},
): Promise<"already-running" | "started" | "timeout"> => {
  if (await deps.isRunning()) return "already-running";

  await deps.open("steam://open/main");
  let waited = 0;
  while (waited < timeoutMs) {
    await deps.sleep(pollMs);
    waited += pollMs;
    if (await deps.isRunning()) {
      await deps.sleep(settleMs);
      return "started";
    }
  }
  return "timeout";
};

/** Steam tourne-t-il ? (liste des processus, sans droit particulier). */
export const isSteamRunning = async (platform: GamePlatform = process.platform as GamePlatform): Promise<boolean> => {
  try {
    if (platform === "win32") {
      const { stdout } = await run("tasklist", ["/FI", "IMAGENAME eq steam.exe", "/NH"]);
      return /steam\.exe/i.test(stdout);
    }
    await run("pgrep", ["-x", platform === "darwin" ? "steam_osx" : "steam"]); // code 1 si absent
    return true;
  } catch {
    return false;
  }
};
