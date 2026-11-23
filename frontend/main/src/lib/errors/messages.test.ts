/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MESSAGE_LANGS, translate } from "./messages";

describe("messages du main", () => {
  it("mêmes clés en français et en anglais, mêmes variables", () => {
    assert.deepEqual(Object.keys(MESSAGE_LANGS.en).sort(), Object.keys(MESSAGE_LANGS.fr).sort());
    const vars = (text: string) => [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort();
    for (const key of Object.keys(MESSAGE_LANGS.fr) as (keyof typeof MESSAGE_LANGS.fr)[]) {
      assert.deepEqual(vars(MESSAGE_LANGS.en[key]), vars(MESSAGE_LANGS.fr[key]), key);
    }
  });

  it("remplace les variables", () => {
    assert.equal(translate("en", "progress.extract", { label: "Base" }), "Base: extracting");
    assert.equal(translate("fr", "progress.extract", { label: "Base" }), "Base : extraction");
  });
});
