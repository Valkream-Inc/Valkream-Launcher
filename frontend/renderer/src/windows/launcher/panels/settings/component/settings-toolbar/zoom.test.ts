/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { clampZoom, MAX_ZOOM, MIN_ZOOM } from "./zoom";

describe("clampZoom", () => {
  it("borne le zoom", () => {
    assert.equal(clampZoom(5), MAX_ZOOM);
    assert.equal(clampZoom(0.1), MIN_ZOOM);
  });

  it("arrondit à 5 % et ignore les valeurs invalides", () => {
    assert.equal(clampZoom(1.0999999), 1.1);
    assert.equal(clampZoom(0.7 + 0.1 * 3), 1);
    assert.equal(clampZoom(Number.NaN), 1);
  });
});
