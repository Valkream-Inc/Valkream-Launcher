/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatOf, parseData } from "./parse-data.js";

describe("format d'un fichier de config", () => {
  it("détecté par l'extension, requête et ancre ignorées", () => {
    assert.equal(formatOf("/games/x/latest.yml"), "yaml");
    assert.equal(formatOf("https://h/a/B.YAML?v=1#x"), "yaml");
    assert.equal(formatOf("/games/x/index.config.json"), "json");
    assert.equal(formatOf("/games/x/index"), "auto");
  });

  it("JSON strict pour .json, sans extension : JSON accepté", async () => {
    assert.deepEqual(await parseData('{"a":1}', "/x.json"), { a: 1 });
    assert.deepEqual(await parseData('{"a":1}', "/x"), { a: 1 });
    await assert.rejects(() => parseData("a: 1", "/x.json"));
  });
});
