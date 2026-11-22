/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isSafeExternalUrl } from "./safe-link.js";

describe("isSafeExternalUrl", () => {
  it("accepte http, https et steam", () => {
    assert.equal(isSafeExternalUrl("https://valkream.com"), true);
    assert.equal(isSafeExternalUrl("http://localhost:3000/x?y=1"), true);
    assert.equal(isSafeExternalUrl("steam://rungameid/892970"), true);
  });

  it("refuse les autres protocoles, les identifiants et les valeurs invalides", () => {
    for (const bad of ["file:///C:/Windows/system32/calc.exe", "javascript:alert(1)", "ms-msdt:/id", "https://user:pw@host.com", "valkream.com", "", "https:// espace"]) {
      assert.equal(isSafeExternalUrl(bad), false, bad);
    }
    assert.equal(isSafeExternalUrl(undefined), false);
    assert.equal(isSafeExternalUrl("https://a.com/" + "x".repeat(3000)), false);
  });
});
