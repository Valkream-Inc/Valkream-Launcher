/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runPool } from "./concurrency";

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 2));

describe("runPool", () => {
  it("traite tous les éléments sans dépasser la limite", async () => {
    let active = 0;
    let peak = 0;
    const seen: number[] = [];
    await runPool([1, 2, 3, 4, 5, 6, 7], 3, async (item) => {
      active++;
      peak = Math.max(peak, active);
      await tick();
      seen.push(item);
      active--;
    });
    assert.deepEqual(seen.sort(), [1, 2, 3, 4, 5, 6, 7]);
    assert.equal(peak, 3);
  });

  it("s'arrête à la première erreur et la relance", async () => {
    const started: number[] = [];
    await assert.rejects(
      runPool([1, 2, 3, 4, 5, 6], 2, async (item) => {
        started.push(item);
        await tick();
        if (item === 2) throw new Error("boom");
      }),
      /boom/,
    );
    assert.ok(started.length < 6);
  });

  it("liste vide et limite invalide acceptées", async () => {
    await runPool([], 4, async () => {});
    const seen: number[] = [];
    await runPool([1, 2], 0, async (item) => void seen.push(item));
    assert.deepEqual(seen, [1, 2]);
  });
});
