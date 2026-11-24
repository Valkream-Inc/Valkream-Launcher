/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { SettingsStore } from "./settings-store.js";

interface S { language: string; musicEnabled: boolean; theme: string }
const defaults: S = { language: "fr", musicEnabled: true, theme: "modern" };
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "settings-"));

describe("SettingsStore", () => {
  it("crée le fichier avec les valeurs par défaut puis persiste chaque changement", async () => {
    const dir = tmp();
    const file = path.join(dir, "sub", "settings.json");
    const store = new SettingsStore(file, defaults);
    await store.init();
    assert.equal(store.get("language"), "fr");
    store.set("language", "en");
    assert.equal(JSON.parse(fs.readFileSync(file, "utf8")).language, "en");
    assert.equal(fs.existsSync(`${file}.tmp`), false); // écriture atomique : pas de reste
    const again = new SettingsStore(file, defaults);
    await again.init();
    assert.equal(again.get("language"), "en");
  });

  it("réglage absent d'un ancien fichier : valeur par défaut", async () => {
    const dir = tmp();
    const file = path.join(dir, "settings.json");
    fs.writeFileSync(file, JSON.stringify({ language: "en" }));
    const store = new SettingsStore(file, defaults);
    await store.init();
    assert.equal(store.get("theme"), "modern");
  });

  it("fichier illisible : mis de côté, valeurs par défaut", async () => {
    const dir = tmp();
    const file = path.join(dir, "settings.json");
    fs.writeFileSync(file, "{pas du json");
    const store = new SettingsStore(file, defaults);
    await store.init();
    assert.equal(store.get("language"), "fr");
    assert.equal(fs.readFileSync(`${file}.corrupt`, "utf8"), "{pas du json");
  });
});
