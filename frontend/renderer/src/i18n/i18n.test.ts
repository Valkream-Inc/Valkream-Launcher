/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import en from "./en";
import fr, { type Messages } from "./fr";

const flatten = (messages: Messages, prefix = ""): Record<string, string> =>
  Object.entries(messages).reduce<Record<string, string>>((all, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string" ? { ...all, [path]: value } : { ...all, ...flatten(value, path) };
  }, {});

const variables = (text: string) => [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((match) => match[1]).sort();

describe("traductions", () => {
  const french = flatten(fr);
  const english = flatten(en);

  it("mêmes clés en français et en anglais", () => {
    assert.deepEqual(Object.keys(english).sort(), Object.keys(french).sort());
  });

  it("mêmes variables {{…}} dans chaque texte", () => {
    for (const key of Object.keys(french)) assert.deepEqual(variables(english[key]), variables(french[key]), key);
  });

  it("aucun texte vide", () => {
    for (const [key, text] of [...Object.entries(french), ...Object.entries(english)]) assert.ok(text.trim() !== "", key);
  });
});
