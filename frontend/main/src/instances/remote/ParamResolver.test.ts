import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { createDiskCache } from "./fetch/disk-cache.js";
import { ParamResolver, type ParamCache } from "./ParamResolver.js";

const memoryCache = (): ParamCache & { store: Map<string, string> } => {
  const store = new Map<string, string>();
  return {
    store,
    read: async (key) => store.get(key) ?? null,
    write: async (key, content) => void store.set(key, content),
  };
};

const resolver = (fetchText: (url: string) => Promise<string>, extra: Partial<ConstructorParameters<typeof ParamResolver>[0]> = {}) =>
  new ParamResolver({ baseUrl: "https://base.test", fetchText, ...extra });

describe("ParamResolver", () => {
  it("rend une donnée inline sans réseau", async () => {
    const r = resolver(async () => assert.fail("pas de réseau"));
    assert.deepEqual(await r.getJson({ a: 1 }), { value: { a: 1 }, source: "inline" });
  });

  it("télécharge un lien relatif, le parse et le met en cache", async () => {
    const cache = memoryCache();
    const urls: string[] = [];
    const r = resolver(async (url) => (urls.push(url), '{"a":1}'), { cache });

    const result = await r.getJson<{ a: number }>("/index.json");
    assert.deepEqual(result, { value: { a: 1 }, source: "online", url: "https://base.test/index.json" });
    assert.deepEqual(urls, ["https://base.test/index.json"]);
    assert.equal(cache.store.get("https://base.test/index.json"), '{"a":1}');
  });

  it("format détecté par l'extension : YAML ou JSON, par getJson comme par getYaml", async () => {
    const r = resolver(async (url) => (url.endsWith(".yml") ? "a: 1\nb:\n  - x\n" : '{"a":1,"b":["x"]}'));
    const expected = { a: 1, b: ["x"] };
    assert.deepEqual((await r.getJson("/f.yml")).value, expected);
    assert.deepEqual((await r.getYaml("/f.json")).value, expected);
    assert.deepEqual((await r.get("/f.yml?v=2")).value, expected);
  });

  it("avec un contexte : variantes canal / plateforme / langue résolues, fichier brut gardé en cache", async () => {
    const cache = memoryCache();
    const raw = JSON.stringify({ title: { fr: "Bonjour", en: "Hello" }, mods: { beta: ["b"], stable: ["s"] }, os: { win32: "w", linux: "l" } });
    const r = resolver(async () => raw, { cache });
    const beta = await r.get<Record<string, unknown>>("/e.json", { channel: "beta", platform: "linux", language: "en" });
    assert.deepEqual(beta.value, { title: "Hello", mods: ["b"], os: "l" });
    assert.equal(cache.store.get("https://base.test/e.json"), raw);
    // Même fichier, autre langue : résolu depuis le texte brut sans changer ce qui est en cache
    const stable = await r.get<Record<string, unknown>>("/e.json", { channel: "stable", platform: "win32", language: "fr" });
    assert.deepEqual(stable.value, { title: "Bonjour", mods: ["s"], os: "w" });
  });

  it("parse le YAML", async () => {
    const r = resolver(async () => "version: 0.0.0.0\nlist:\n  - a\n");
    const result = await r.getYaml<{ version: string; list: string[] }>("/latest.yml");
    assert.deepEqual(result.value, { version: "0.0.0.0", list: ["a"] });
  });

  it("retombe sur la dernière valeur connue si le serveur est injoignable", async () => {
    const cache = memoryCache();
    cache.store.set("https://base.test/index.json", '{"a":2}');
    const r = resolver(async () => { throw new Error("réseau coupé"); }, { cache });

    const result = await r.getJson<{ a: number }>("/index.json");
    assert.equal(result.source, "cache");
    assert.deepEqual(result.value, { a: 2 });
  });

  it("lève l'erreur d'origine sans copie locale", async () => {
    const r = resolver(async () => { throw new Error("réseau coupé"); }, { cache: memoryCache() });
    await assert.rejects(() => r.getJson("/index.json"), /réseau coupé/);
  });

  it("ne met pas en cache un contenu qui ne se parse pas, et garde l'ancienne copie", async () => {
    const cache = memoryCache();
    cache.store.set("https://base.test/index.json", '{"a":3}');
    const r = resolver(async () => "<html>erreur 500</html>", { cache });

    const result = await r.getJson<{ a: number }>("/index.json");
    assert.equal(result.source, "cache");
    assert.equal(cache.store.get("https://base.test/index.json"), '{"a":3}');
  });

  it("exige HTTPS, sauf allowInsecure", async () => {
    const insecure = resolver(async () => "{}");
    await assert.rejects(() => insecure.getJson("http://a.test/x.json"), /HTTPS obligatoire/);

    const dev = resolver(async () => "{}", { allowInsecure: true });
    assert.equal((await dev.getJson("http://localhost:3000/x.json")).source, "online");
  });

  it("refuse un lien invalide ou « .. » avant tout réseau", async () => {
    const r = resolver(async () => assert.fail("pas de réseau"));
    await assert.rejects(() => r.getJson("binary"), /invalide/);
    await assert.rejects(() => r.getJson("/a/../b"), /\.\./);
  });
});

describe("createDiskCache", () => {
  it("écrit puis relit, et renvoie null pour une clé inconnue", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "valkream-cache-"));
    try {
      const cache = createDiskCache(path.join(dir, "sub"));
      assert.equal(await cache.read("https://a.test/x"), null);
      await cache.write("https://a.test/x", "contenu");
      assert.equal(await cache.read("https://a.test/x"), "contenu");
      assert.equal(await cache.read("https://a.test/y"), null);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
