/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Journal d'installation d'un canal (`instance.log`) : un évènement par ligne JSON
 * (`LogRecord` : date, niveau, clé de traduction + variables). Le texte est traduit à
 * l'affichage par l'interface : changer de langue change donc aussi les anciennes lignes.
 * Tronqué à la moitié quand il dépasse 512 Ko. Le journal ne doit jamais faire échouer une installation.
 */

import fs from "fs";
import path from "path";

import type { LogRecord } from "@shared/types";

export const INSTALL_LOG_FILE = "instance.log";
const MAX_BYTES = 512 * 1024;

export const appendInstallLog = (
  installDir: string,
  key: string,
  vars?: LogRecord["vars"],
  level: LogRecord["level"] = "INFO",
  options: { separator?: boolean; now?: Date; texts?: LogRecord["texts"] } = {},
): void => {
  try {
    const file = path.join(installDir, INSTALL_LOG_FILE);
    fs.mkdirSync(installDir, { recursive: true });
    if (fs.existsSync(file) && fs.statSync(file).size > MAX_BYTES) {
      const kept = fs.readFileSync(file, "utf8").slice(-MAX_BYTES / 2);
      fs.writeFileSync(file, kept.slice(kept.indexOf("\n") + 1));
    }
    const record: LogRecord = {
      time: (options.now ?? new Date()).toISOString(),
      level,
      key,
      ...(vars ? { vars } : {}),
      ...(options.texts ? { texts: options.texts } : {}),
      ...(options.separator ? { sep: true as const } : {}),
    };
    fs.appendFileSync(file, `${JSON.stringify(record)}\n`);
  } catch {
    // journal facultatif
  }
};

export const readInstallLog = (installDir: string): string => {
  try {
    return fs.readFileSync(path.join(installDir, INSTALL_LOG_FILE), "utf8");
  } catch {
    return "";
  }
};
