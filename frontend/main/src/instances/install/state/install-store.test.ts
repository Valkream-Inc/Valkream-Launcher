import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import {
  readInstallState, readInstanceSettings, recordInstalledEntry, writeInstanceSetting, SETTINGS_FILE, STATE_FILE,
} from "./install-store.js";

let dir: string;
beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), "store-")); });
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("install-store", () => {
  it("dossier vide : état et réglages vides", () => {
    assert.deepEqual(readInstallState(dir).entries, {});
    assert.deepEqual(readInstanceSettings(dir), {});
  });

  it("enregistre une entrée installée", () => {
    recordInstalledEntry(dir, "base", { version: "1.0.0", hash: "h" }, () => new Date("2026-01-01T00:00:00Z"));
    assert.deepEqual(readInstallState(dir).entries.base, { version: "1.0.0", hash: "h", installedAt: "2026-01-01T00:00:00.000Z" });
    assert.equal(fs.existsSync(path.join(dir, STATE_FILE + ".tmp")), false);
  });

  it("fichier corrompu : traité comme vide, sans exception", () => {
    fs.writeFileSync(path.join(dir, STATE_FILE), "{pas du json");
    fs.writeFileSync(path.join(dir, SETTINGS_FILE), "[1,2]");
    assert.deepEqual(readInstallState(dir).entries, {});
    assert.deepEqual(readInstanceSettings(dir), {});
  });

  it("réglages : le fichier ne garde que les choix du joueur, le retour ajoute les défauts", () => {
    const result = writeInstanceSetting(dir, "quality", "high", { launchSteam: true, quality: "low" });
    assert.deepEqual(result, { launchSteam: true, quality: "high" });
    assert.deepEqual(readInstanceSettings(dir), { quality: "high" });
  });

  it("réglages : fusionne, refuse noms et valeurs invalides", () => {
    writeInstanceSetting(dir, "modsAdmin", true);
    assert.deepEqual(writeInstanceSetting(dir, "quality", "high"), { modsAdmin: true, quality: "high" });
    assert.throws(() => writeInstanceSetting(dir, "../x", true), /invalide/);
    assert.equal(writeInstanceSetting(dir, "ram", 3).ram, 3); // nombre : curseur
    assert.throws(() => writeInstanceSetting(dir, "ok", Number.NaN), /invalide/);
    assert.throws(() => writeInstanceSetting(dir, "ok", {} as unknown as boolean), /invalide/);
  });
});
