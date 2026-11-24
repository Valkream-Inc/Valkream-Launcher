/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Lecture de la sortie de DepotDownloader (en anglais) : étape en cours, cause d'un échec.
 * L'interface affiche des messages traduits ; le journal brut reste visible pour le support.
 *
 * Les motifs viennent des messages habituels de DepotDownloader / SteamKit (connexion, licence, manifeste,
 * limitation de débit, disque, réseau). Un message inconnu retombe sur l'erreur générale, avec la dernière
 * ligne de l'outil en détail : rien n'est inventé.
 */

import type { DepotStepName } from "@shared/types";

import type { MessageKey } from "../../../lib/errors/messages.js";
import { parseDepotPercent } from "./depot-runner.js";

/** Étape déduite d'une ligne de DepotDownloader (`undefined` : la ligne ne change rien). */
export const parseDepotStep = (line: string): DepotStepName | undefined => {
  if (parseDepotPercent(line) !== undefined) return "download";
  if (/qr|logging .* into steam|logging in|waiting for .*(confirm|approv|scan)|steam guard/i.test(line)) return "login";
  if (/logged in|got depot key|downloading depot|pre-?allocating|validating|manifest .*(download|got)|\bbuilding\b/i.test(line)) return "download";
  if (/total downloaded|disconnected from steam|download(ed)? complete/i.test(line)) return "finish";
  return undefined;
};

export interface DepotFailure {
  key: MessageKey;
  /** Dernière ligne utile de l'outil (pour le détail de l'erreur). */
  detail: string;
}

const RULES: [RegExp, MessageKey][] = [
  [/qr.*(expired|timed? ?out|timeout)|(expired|timed? ?out).*qr|challenge.*(expired|timed? ?out)/i, "err.depotQrTimeout"],
  [/rate ?limit|too many (login )?(attempts|requests)|toomanyrequests|loginthrottle|throttle/i, "err.depotRateLimit"],
  [/invalidpassword|accountlogindenied|logon.*fail|login.*(fail|denied)|unable to log ?in|twofactor|two.?factor|invalid (token|password)|access ?denied.*(login|account)/i, "err.depotLogin"],
  [/not (available|owned)|does not own|no (subscription|license)|access ?denied|failed to get (depot key|manifest)|unable to get.*(manifest|depot)|manifest.*(not found|unavailable|failed)|\bnotfound\b/i, "err.depotNotOwned"],
  [/no space left|not enough (disk )?space|enospc|disk full|insufficient (disk|storage)/i, "err.depotNoSpace"],
  [/timed? ?out|timeout|connection (refused|reset|lost|failed|closed)|unable to connect|socketexception|name or service not known|network|disconnected/i, "err.depotNetwork"],
];

const lastUseful = (lines: readonly string[]): string => {
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line !== "" && parseDepotPercent(line) === undefined && !/^[▀-▟\s]+$/.test(line)) return line.slice(0, 200);
  }
  return "—";
};

/** Cause probable d'un échec (code de sortie non nul), d'après les dernières lignes de l'outil. */
export const classifyDepotFailure = (lines: readonly string[]): DepotFailure => {
  const detail = lastUseful(lines);
  // Les dernières lignes décrivent la cause ; on regarde d'abord la plus récente
  const recent = lines.slice(-40);
  for (const [pattern, key] of RULES) {
    if (recent.some((line) => pattern.test(line))) return { key, detail };
  }
  return { key: "err.depotFailed", detail };
};
