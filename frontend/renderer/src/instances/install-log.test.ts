/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import fr from "../i18n/fr";
import en from "../i18n/en";
import { formatInstallLog, formatLogTime, parseInstallLog } from "./install-log";

const lookup = (dict: Record<string, unknown>) => (key: string, vars: Record<string, string | number> = {}) => {
  const value = key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], dict);
  return String(value ?? key).replace(/{{\s*(\w+)\s*}}/g, (_, name: string) => String(vars[name] ?? ""));
};

const lines = (records: object[]) => records.map((record) => JSON.stringify(record)).join("\n");

describe("journal côté interface", () => {
  const text = lines([
    { time: "2026-11-22T10:10:03Z", level: "INFO", key: "log.start", vars: { channel: "stable", repair: 0, count: 2 }, sep: true },
    { time: "2026-11-22T10:10:04Z", level: "ERROR", key: "log.entryError", vars: { entry: "base", message: "boom" } },
    { time: "2026-11-22T10:10:05Z", level: "WARN", key: "log.summary", vars: { seconds: 2, ok: 0, failed: 1, cancelled: 1 } },
  ]);

  it("la même ligne est retraduite selon la langue courante", () => {
    const parsed = parseInstallLog(text);
    assert.match(formatInstallLog(parsed, lookup(fr)), /Synchronisation \[stable\] : 2 entrée\(s\)/);
    assert.match(formatInstallLog(parsed, lookup(en)), /Sync \[stable\]: 2 entries/);
    assert.match(formatInstallLog(parsed, lookup(fr)), /Annulée après 2 s/);
    assert.match(formatInstallLog(parsed, lookup(en)), /Cancelled after 2s/);
  });

  it("variante réparation, niveau aligné, message d'erreur conservé", () => {
    const repair = parseInstallLog(lines([{ time: "2026-11-22T10:10:03Z", level: "INFO", key: "log.start", vars: { channel: "beta", repair: 1, count: 1 } }]));
    assert.match(formatInstallLog(repair, lookup(en)), /Repair \[beta\]/);
    assert.match(formatInstallLog(parseInstallLog(text), lookup(fr)), / ERROR base : boom/);
  });

  it("ancien format ou ligne illisible : affichée telle quelle", () => {
    const parsed = parseInstallLog("2026-01-01T00:00:00.000Z [stable] base start\n{pas du json}\n");
    assert.deepEqual(parsed.map((line) => line.kind), ["raw", "raw"]);
    assert.equal(formatInstallLog(parsed, lookup(fr)).split("\n")[1], "{pas du json}");
  });

  it("date invalide conservée", () => {
    assert.equal(formatLogTime("pas une date"), "pas une date");
  });
});
