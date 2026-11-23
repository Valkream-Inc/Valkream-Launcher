/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { readLegacySettings } from "./legacy-settings.js";
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

  it("reprend les réglages de l'ancienne base au premier lancement, jamais ensuite", async () => {
    const dir = tmp();
    const file = path.join(dir, "settings.json");
    let calls = 0;
    const legacy = async () => (calls++, { language: "en", musicEnabled: false });
    await new SettingsStore(file, defaults, legacy).init();
    const store = new SettingsStore(file, defaults, legacy);
    await store.init();
    assert.equal(store.get("language"), "en");
    assert.equal(store.get("musicEnabled"), false);
    assert.equal(calls, 1);
  });

  it("migration en échec : réglages par défaut, sans bloquer", async () => {
    const file = path.join(tmp(), "settings.json");
    const store = new SettingsStore(file, defaults, async () => { throw new Error("module absent"); });
    await store.init();
    assert.equal(store.get("language"), "fr");
  });
});

describe("readLegacySettings", () => {
  const opener = (json: string | undefined) => async () => ({
    prepare: () => ({ get: () => (json === undefined ? undefined : { json_data: json }) }),
    close: () => undefined,
  });

  it("lit la ligne JSON de configClient sans son ID", async () => {
    const dir = tmp();
    fs.writeFileSync(path.join(dir, "Databases.db"), "");
    const result = await readLegacySettings<S>(dir, "Databases.db", opener(JSON.stringify({ language: "en", ID: 1 })));
    assert.deepEqual(result, { language: "en" });
  });

  it("base absente, ligne absente, JSON invalide ou module manquant : undefined", async () => {
    const dir = tmp();
    assert.equal(await readLegacySettings(dir, "Databases.db", opener("{}")), undefined);
    fs.writeFileSync(path.join(dir, "Databases.db"), "");
    assert.equal(await readLegacySettings(dir, "Databases.db", opener(undefined)), undefined);
    assert.equal(await readLegacySettings(dir, "Databases.db", opener("{nope")), undefined);
    assert.equal(await readLegacySettings(dir, "Databases.db", async () => { throw new Error("no module"); }), undefined);
  });
});
