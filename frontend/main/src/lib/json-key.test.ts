/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isValidKey, pickKey } from "./json-key";

describe("pickKey", () => {
  const data = { dependencies: { mods: ["A-B-1.0.0"] }, packs: [{ list: [1] }] };

  it("absent ou « . » : tout le contenu", () => {
    assert.equal(pickKey(data), data);
    assert.equal(pickKey(data, "."), data);
  });
  it("chemin pointé et index de tableau", () => {
    assert.deepEqual(pickKey(data, "dependencies.mods"), ["A-B-1.0.0"]);
    assert.deepEqual(pickKey(data, "packs.0.list"), [1]);
  });
  it("clé absente : erreur claire", () => {
    assert.throws(() => pickKey(data, "dependencies.nope"), /introuvable/);
    assert.throws(() => pickKey(data, "packs.3"), /introuvable/);
  });
  it("validité de la clé", () => {
    assert.ok(isValidKey(".") && isValidKey("a.b"));
    assert.ok(!isValidKey("a..b") && !isValidKey(".a"));
  });
});
