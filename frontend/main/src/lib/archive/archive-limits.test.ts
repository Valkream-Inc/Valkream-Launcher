/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assertArchiveWithinLimits } from "./archive-limits.js";

describe("assertArchiveWithinLimits", () => {
  const limits = { maxFiles: 3, maxBytes: 100 };

  it("accepte une archive dans les limites", () => {
    assertArchiveWithinLimits([{ uncompressedSize: 40 }, { uncompressedSize: 60 }], limits);
  });

  it("refuse trop de fichiers", () => {
    const entries = Array.from({ length: 4 }, () => ({ uncompressedSize: 1 }));
    assert.throws(() => assertArchiveWithinLimits(entries, limits), /4 fichiers/);
  });

  it("refuse une taille décompressée excessive", () => {
    assert.throws(() => assertArchiveWithinLimits([{ uncompressedSize: 60 }, { uncompressedSize: 41 }], limits), /taille décompressée/);
  });
});
