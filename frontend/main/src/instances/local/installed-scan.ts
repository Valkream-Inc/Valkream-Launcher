/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Installations présentes sur le disque (`<racine>/instances/<id>/<canal>`) que le serveur ne propose plus :
 * id retiré du launcher, instance désactivée, canal supprimé (ex : ancien alpha). Elles restent affichées,
 * marquées « obsolète », pour pouvoir être désinstallées (elles prennent de la place).
 */

import fs from "fs";
import path from "path";

import type { Channel, DeprecatedInstall, InstanceSummary } from "@shared/types";

import { INSTANCES_DIR } from "../../lib/fs/games-root.js";
import { isSafeSegment } from "../../lib/fs/paths.js";

const CHANNELS: readonly Channel[] = ["stable", "beta", "alpha"];

export interface InstalledInstance {
  id: string;
  channel: Channel;
}

/** Une ligne par dossier `<id>/<canal>` existant (dossiers temporaires de déplacement ignorés). */
export const scanInstalledInstances = (gamesRoot: string): InstalledInstance[] => {
  const base = path.join(gamesRoot, INSTANCES_DIR);
  let ids: fs.Dirent[];
  try {
    ids = fs.readdirSync(base, { withFileTypes: true });
  } catch {
    return [];
  }
  const found: InstalledInstance[] = [];
  for (const id of ids) {
    if (!id.isDirectory() || !isSafeSegment(id.name)) continue;
    for (const channel of CHANNELS) {
      if (fs.existsSync(path.join(base, id.name, channel))) found.push({ id: id.name, channel });
    }
  }
  return found;
};

/**
 * Parmi les installations du disque, celles que le launcher ne propose plus.
 * `knownIds` : instances décrites par le launcher (config main) ; `summaries` : état du serveur.
 */
export const deprecatedInstalls = (
  installed: readonly InstalledInstance[],
  knownIds: ReadonlySet<string>,
  summaries: readonly InstanceSummary[],
): DeprecatedInstall[] => {
  const result: DeprecatedInstall[] = [];
  for (const { id, channel } of installed) {
    if (!knownIds.has(id)) {
      result.push({ id, channel, reason: "removed" });
      continue;
    }
    const summary = summaries.find((item) => item.id === id);
    // Serveur injoignable ou index invalide : on ne sait rien, rien n'est déclaré obsolète
    if (!summary || (summary.availability !== "enabled" && summary.availability !== "disabled")) continue;
    if (summary.availability === "disabled") result.push({ id, channel, reason: "disabled" });
    else if (summary.channels.length > 0 && !summary.channels.includes(channel)) {
      result.push({ id, channel, reason: "channel-removed" });
    }
  }
  return result;
};
