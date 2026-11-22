/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pickText } from "./localized";

describe("pickText", () => {
  it("chaîne seule : telle quelle, quelle que soit la langue", () => {
    assert.equal(pickText("Bonjour", "en"), "Bonjour");
    assert.equal(pickText(undefined, "fr"), undefined);
  });

  it("une chaîne par langue : la langue demandée", () => {
    assert.equal(pickText({ fr: "Salut", en: "Hello" }, "en"), "Hello");
    assert.equal(pickText({ fr: "Salut", en: "Hello" }, "fr"), "Salut");
  });

  it("langue absente : repli sur le français puis l'anglais", () => {
    assert.equal(pickText({ fr: "Salut" }, "en"), "Salut");
    assert.equal(pickText({ en: "Hello" }, "fr"), "Hello");
    assert.equal(pickText({}, "fr"), undefined);
  });
});
