/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { errorText, errorTexts, LocalizedError, setErrorLanguage } from "./localized-error.js";
import { MESSAGE_LANGS } from "./messages.js";

describe("LocalizedError", () => {
  afterEach(() => setErrorLanguage(() => "fr"));

  it("message en français par défaut, suit la langue branchée", () => {
    assert.equal(new LocalizedError("err.hashInvalid", { name: "base", file: "a.txt" }).message, "base : hash invalide pour a.txt");
    setErrorLanguage(() => "en");
    assert.equal(new LocalizedError("err.hashInvalid", { name: "base", file: "a.txt" }).message, "base: invalid hash for a.txt");
  });

  it("errorText / errorTexts : langue au choix, erreur ordinaire inchangée", () => {
    const error = new LocalizedError("err.diskSpace", { free: 10, needed: 20 });
    assert.match(errorText(error, "en"), /10 MB free, 20 MB needed/);
    assert.deepEqual(Object.keys(errorTexts(error)), ["fr", "en"]);
    assert.equal(errorText(new Error("brut"), "en"), "brut");
  });

  it("fr et en ont les mêmes clés et les mêmes variables", () => {
    const vars = (text: string) => [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((match) => match[1]).sort().join(",");
    assert.deepEqual(Object.keys(MESSAGE_LANGS.fr).sort(), Object.keys(MESSAGE_LANGS.en).sort());
    for (const key of Object.keys(MESSAGE_LANGS.fr) as (keyof typeof MESSAGE_LANGS.fr)[]) {
      assert.equal(vars(MESSAGE_LANGS.fr[key]), vars(MESSAGE_LANGS.en[key]), key);
    }
  });
});
