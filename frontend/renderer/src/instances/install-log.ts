/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Journal d'installation côté interface : lecture des lignes JSON du main (`LogRecord`) et
 * mise en texte dans la langue COURANTE (changer de langue retraduit tout le journal).
 * Une ligne qui n'est pas du JSON (ancien format) est affichée telle quelle.
 */

import type { LogRecord } from "@shared/types";

export type ParsedLogLine =
  | { kind: "record"; record: LogRecord }
  | { kind: "raw"; text: string };

type Translate = (key: string, vars?: Record<string, string | number>) => string;

const isRecord = (value: unknown): value is LogRecord => {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.time === "string" && typeof item.key === "string" && ["INFO", "WARN", "ERROR"].includes(String(item.level));
};

export const parseInstallLog = (text: string): ParsedLogLine[] =>
  text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line): ParsedLogLine => {
      try {
        const parsed: unknown = JSON.parse(line);
        if (isRecord(parsed)) return { kind: "record", record: parsed };
      } catch {
        /* ligne d'un ancien format */
      }
      return { kind: "raw", text: line };
    });

const pad = (value: number): string => String(value).padStart(2, "0");

/** `2026-11-22 11:10:03` en heure locale. */
export const formatLogTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

/** Clé de traduction réelle : le début de synchro et la fin dépendent de variables 0 / 1. */
const keyOf = (record: LogRecord): string => {
  if (record.key === "log.start" && record.vars?.repair === 1) return "log.startRepair";
  if (record.key === "log.summary" && record.vars?.cancelled === 1) return "log.summaryCancelled";
  return record.key;
};

export const logMessage = (record: LogRecord, t: Translate): string =>
  t(keyOf(record), record.vars).replace(/\s*\n\s*/g, " ");

/** Texte brut (copie pour le support) : `2026-11-22 11:10:03 INFO  message`, ligne vide entre synchronisations. */
export const formatInstallLog = (lines: ParsedLogLine[], t: Translate): string =>
  lines
    .map((line, index) =>
      line.kind === "raw"
        ? line.text
        : `${line.record.sep && index > 0 ? "\n" : ""}${formatLogTime(line.record.time)} ${line.record.level.padEnd(5)} ${logMessage(line.record, t)}`,
    )
    .join("\n");
