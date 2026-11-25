/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { allVariantContexts, isVariantTable, resolveVariants, variantKind } from "./variants.js";

describe("variantes canal / plateforme / langue", () => {
  it("reconnaît une table de variantes, pas des données", () => {
    assert.equal(variantKind({ stable: "/a" }), "channel");
    assert.equal(variantKind({ win32: 1, default: 2 }), "platform");
    assert.equal(variantKind({ fr: "a", en: "b" }), "language");
    assert.equal(variantKind({ default: "x" }), "any");
    assert.equal(variantKind({}), null);
    assert.equal(variantKind({ title: "t", stable: "x" }), null); // mélange : c'est une donnée
    assert.equal(variantKind({ stable: 1, fr: 2 }), null);
    assert.equal(isVariantTable([{ stable: 1 }]), false);
    assert.equal(isVariantTable("/lien"), false);
  });

  it("valeur simple : identique pour tous", () => {
    const list = [{ name: "a" }];
    assert.deepEqual(resolveVariants(list, { channel: "beta" }), list);
    assert.equal(resolveVariants("/e.json", { channel: "beta" }), "/e.json");
    assert.equal(resolveVariants(undefined, {}), undefined);
  });

  it("canal exact, sinon default, sinon stable, sinon rien", () => {
    const table = { stable: "/s", beta: "/b" };
    assert.equal(resolveVariants(table, { channel: "beta" }), "/b");
    assert.equal(resolveVariants(table, { channel: "alpha" }), "/s");
    assert.equal(resolveVariants({ beta: "/b", default: "/d", stable: "/s" }, { channel: "alpha" }), "/d");
    assert.equal(resolveVariants({ beta: "/b" }, { channel: "stable" }), undefined);
  });

  it("plateforme : clé exacte, sinon default ; langue : exacte, default, fr, en", () => {
    assert.equal(resolveVariants({ win32: "w", default: "d" }, { platform: "linux" }), "d");
    assert.equal(resolveVariants({ win32: "w" }, { platform: "linux" }), undefined);
    assert.equal(resolveVariants({ fr: "Bonjour", en: "Hello" }, { language: "en" }), "Hello");
    assert.equal(resolveVariants({ en: "Hello" }, { language: "fr" }), "Hello");
  });

  it("combinable dans n'importe quel ordre, à toute profondeur", () => {
    const value = {
      mods: { beta: { win32: { fr: "/mods-beta-win-fr.json", en: "/mods-beta-win-en.json" } }, stable: "/mods.json" },
      nested: { description: { fr: "Bonjour", en: { linux: "Hi linux", win32: "Hi win" } } },
      list: [{ stable: "a", beta: "b" }, { alpha: "seulement alpha" }],
    };
    const resolved = resolveVariants(value, { channel: "beta", platform: "win32", language: "en" });
    assert.deepEqual(resolved, {
      mods: "/mods-beta-win-en.json",
      nested: { description: "Hi win" },
      list: ["b"],
    });
    assert.deepEqual(resolveVariants(value, { channel: "stable", platform: "linux", language: "fr" }), {
      mods: "/mods.json",
      nested: { description: "Bonjour" },
      list: ["a"],
    });
  });

  it("type absent du contexte : la table est conservée, ses valeurs sont résolues", () => {
    const value = { depot: { win32: { id: 1, name: { fr: "a", en: "b" } } } };
    assert.deepEqual(resolveVariants(value, { language: "en" }), { depot: { win32: { id: 1, name: "b" } } });
  });

  it("clés structurelles (channels, enabled) jamais résolues", () => {
    const index = { channels: { stable: "/s.yml", beta: "/b.yml" }, enabled: { win32: true }, event: { stable: "/e.json" } };
    assert.deepEqual(resolveVariants(index, { channel: "beta", platform: "win32", language: "fr" }), {
      channels: { stable: "/s.yml", beta: "/b.yml" },
      enabled: { win32: true },
      event: "/e.json",
    });
  });

  it("18 combinaisons canal × plateforme × langue", () => {
    assert.equal(allVariantContexts().length, 18);
  });
});
