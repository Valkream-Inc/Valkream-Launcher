/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Journal d'installation d'un canal (`instance.log`) : une ligne par évènement
 * (début, fin, erreur d'une entrée), au format `2026-11-22 11:10:03 INFO  message` (heure locale),
 * avec une ligne vide entre deux synchronisations. Tronqué à la moitié quand il dépasse 512 Ko.
 * Le journal ne doit jamais faire échouer une installation.
 */

import fs from "fs";
import path from "path";

export const INSTALL_LOG_FILE = "instance.log";
const MAX_BYTES = 512 * 1024;

export type LogLevel = "INFO" | "WARN" | "ERROR";

const pad = (value: number): string => String(value).padStart(2, "0");

/** `2026-11-22 11:10:03` (heure locale : le journal est lu par la personne qui fait le support). */
export const formatLogTime = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

export const formatLogLine = (level: LogLevel, message: string, now: Date): string =>
  `${formatLogTime(now)} ${level.padEnd(5)} ${message.replace(/\s*\n\s*/g, " ")}\n`;

export const appendInstallLog = (
  installDir: string,
  message: string,
  level: LogLevel = "INFO",
  now: Date = new Date(),
  options: { separator?: boolean } = {},
): void => {
  try {
    const file = path.join(installDir, INSTALL_LOG_FILE);
    fs.mkdirSync(installDir, { recursive: true });
    if (fs.existsSync(file) && fs.statSync(file).size > MAX_BYTES) {
      const kept = fs.readFileSync(file, "utf8").slice(-MAX_BYTES / 2);
      fs.writeFileSync(file, kept.slice(kept.indexOf("\n") + 1));
    }
    fs.appendFileSync(file, `${options.separator && fs.existsSync(file) ? "\n" : ""}${formatLogLine(level, message, now)}`);
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
