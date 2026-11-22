/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { appendInstallLog, formatLogLine, readInstallLog } from "./install-log.js";

describe("journal d'installation", () => {
  it("format : date locale, niveau aligné, message sur une ligne", () => {
    const line = formatLogLine("ERROR", "a\n  b", new Date(2026, 10, 22, 11, 10, 3));
    assert.equal(line, "2026-11-22 11:10:03 ERROR a b\n");
    assert.equal(formatLogLine("INFO", "x", new Date(2026, 0, 2, 3, 4, 5)), "2026-01-02 03:04:05 INFO  x\n");
  });

  it("sépare deux synchronisations par une ligne vide (pas avant la première)", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "log-"));
    appendInstallLog(dir, "un", "INFO", new Date(), { separator: true });
    appendInstallLog(dir, "deux");
    appendInstallLog(dir, "trois", "INFO", new Date(), { separator: true });
    const lines = readInstallLog(dir).split("\n");
    assert.equal(lines[2], "");
    assert.equal(lines.filter((line) => line === "").length, 2); // séparateur + fin de fichier
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
