/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { appendInstallLog, readInstallLog } from "./install-log.js";

describe("journal d'installation", () => {
  it("écrit un évènement JSON par ligne (clé + variables, pas de texte traduit)", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "log-"));
    appendInstallLog(dir, "log.start", { count: 2 }, "INFO", { separator: true, now: new Date("2026-11-22T10:10:03Z") });
    appendInstallLog(dir, "log.entryError", { entry: "base", message: "boom\nsuite" }, "ERROR");
    const [first, second] = readInstallLog(dir).trim().split("\n").map((line) => JSON.parse(line));
    assert.deepEqual(first, { time: "2026-11-22T10:10:03.000Z", level: "INFO", key: "log.start", vars: { count: 2 }, sep: true });
    assert.equal(second.level, "ERROR");
    assert.equal(second.vars.message, "boom\nsuite");
    assert.equal(second.sep, undefined);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("tronque le journal à la moitié au-delà de 512 Ko sans casser les lignes", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "log-"));
    const filler = JSON.stringify({ time: "x", level: "INFO", key: "k", vars: { a: "a".repeat(1000) } });
    fs.writeFileSync(path.join(dir, "instance.log"), `${Array(600).fill(filler).join("\n")}\n`);
    appendInstallLog(dir, "log.entryDone", { entry: "e" });
    const lines = readInstallLog(dir).trim().split("\n");
    assert.ok(lines.length < 400);
    for (const line of lines) JSON.parse(line);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
