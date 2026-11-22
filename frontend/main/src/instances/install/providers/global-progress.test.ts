/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createGlobalProgress } from "./global-progress.js";
import type { TransferProgress } from "./types.js";

describe("createGlobalProgress", () => {
  it("un pourcentage global sur plusieurs unités en parallèle", () => {
    const seen: TransferProgress[] = [];
    const progress = createGlobalProgress((p) => seen.push(p), () => 4);
    progress.skip(); // 25 %
    progress.update("a", 0.5, 100); // 25 + 12,5
    progress.update("b", 0.5, 100); // 25 + 25
    assert.equal(seen.at(-1)?.percent, 50);
    progress.finish("a", 200);
    progress.finish("b", 200);
    progress.finish("c");
    progress.finish("d");
    assert.equal(seen.at(-1)?.percent, 100);
    assert.equal(seen.at(-1)?.processed, 400);
  });

  it("le pourcentage ne recule pas quand le total grandit", () => {
    let total = 2;
    const seen: number[] = [];
    const progress = createGlobalProgress((p) => seen.push(p.percent), () => total);
    progress.finish("a");
    total = 4;
    progress.update("b", 0, 0);
    assert.deepEqual(seen, [50, 50]);
  });
});
