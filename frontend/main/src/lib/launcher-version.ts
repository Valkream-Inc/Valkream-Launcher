/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Changement de version du launcher : lors d'un changement de version MAJEURE, les installations
 * sont supprimées (réinstallation propre) ; seuls les réglages du joueur sont conservés.
 * Les mises à jour mineures / correctifs ne touchent à rien.
 * Module sans dépendance Electron.
 */

import fs from "fs";
import path from "path";

const SETTINGS_FILE = "instance.settings.json";

export type VersionChange = "first-run" | "same" | "minor" | "major";

export const majorOf = (version: string): number | undefined => {
  const match = /^v?(\d+)\./.exec(version);
  return match ? parseInt(match[1], 10) : undefined;
};

export const compareVersions = (previous: string | undefined, current: string): VersionChange => {
  if (previous === undefined) return "first-run";
  if (previous === current) return "same";
  const before = majorOf(previous);
  const now = majorOf(current);
  return before !== undefined && now !== undefined && before === now ? "minor" : "major";
};

const readStored = (file: string): string | undefined => {
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as { launcherVersion?: unknown };
    return typeof raw.launcherVersion === "string" ? raw.launcherVersion : undefined;
  } catch {
    return undefined;
  }
};

/** Supprime le contenu de `<instances>/<id>/<canal>` sauf les réglages ; retourne les dossiers nettoyés. */
export const wipeInstallations = (instancesDir: string): string[] => {
  const cleaned: string[] = [];
  if (!fs.existsSync(instancesDir)) return cleaned;
  for (const id of fs.readdirSync(instancesDir)) {
    const idDir = path.join(instancesDir, id);
    if (!fs.statSync(idDir).isDirectory()) continue;
    for (const channel of fs.readdirSync(idDir)) {
      const installDir = path.join(idDir, channel);
      if (!fs.statSync(installDir).isDirectory()) continue;
      for (const name of fs.readdirSync(installDir)) {
        if (name !== SETTINGS_FILE) fs.rmSync(path.join(installDir, name), { recursive: true, force: true });
      }
      cleaned.push(installDir);
    }
  }
  return cleaned;
};

/** À appeler une fois au démarrage. Enregistre toujours la version courante. */
export const applyLauncherVersion = (options: {
  versionFile: string;
  instancesDir: string;
  current: string;
}): { change: VersionChange; cleaned: string[] } => {
  const change = compareVersions(readStored(options.versionFile), options.current);
  const cleaned = change === "major" ? wipeInstallations(options.instancesDir) : [];
  if (change !== "same") {
    fs.mkdirSync(path.dirname(options.versionFile), { recursive: true });
    fs.writeFileSync(options.versionFile, JSON.stringify({ launcherVersion: options.current }, null, 2));
  }
  return { change, cleaned };
};
