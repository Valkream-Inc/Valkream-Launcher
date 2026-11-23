/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { HttpError, parseRetryAfter } from "./http.js";
import { mapLimited } from "./limiter.js";

const instant = async () => {};

describe("mapLimited", () => {
  it("limite les appels simultanés et garde l'ordre des résultats", async () => {
    let running = 0;
    let peak = 0;
    const results = await mapLimited(
      [1, 2, 3, 4, 5, 6, 7, 8],
      async (n) => {
        running++;
        peak = Math.max(peak, running);
        await new Promise((resolve) => setTimeout(resolve, 5));
        running--;
        return n * 2;
      },
      { concurrency: 3, intervalMs: 0, sleep: instant },
    );
    assert.deepEqual(results, [2, 4, 6, 8, 10, 12, 14, 16]);
    assert.ok(peak <= 3, `pic ${peak}`);
  });

  it("espace les départs d'appel", async () => {
    const waits: number[] = [];
    await mapLimited([1, 2, 3], async () => 0, { concurrency: 1, intervalMs: 100, sleep: async (ms) => void waits.push(ms) });
    assert.equal(waits.length >= 2, true);
    assert.ok(waits[0] > 0 && waits[0] <= 100 && waits[1] > waits[0]); // 2e et 3e départs reculent de 100 ms chacun (horloge figée par le faux sleep)
  });

  it("429 : nouvelle tentative après Retry-After, puis succès", async () => {
    const waits: number[] = [];
    let calls = 0;
    const [value] = await mapLimited(
      ["x"],
      async () => {
        if (++calls < 3) throw new HttpError(429, "https://api", calls === 1 ? 2500 : undefined);
        return "ok";
      },
      { intervalMs: 0, backoffMs: 1000, sleep: async (ms) => void waits.push(ms) },
    );
    assert.equal(value, "ok");
    assert.deepEqual(waits.filter((ms) => ms > 0), [2500, 2000]); // Retry-After puis repli exponentiel (1000 × 2¹)
  });

  it("429 persistant : abandon après les tentatives ; autre erreur : aucune nouvelle tentative", async () => {
    let calls = 0;
    await assert.rejects(
      mapLimited(["x"], async () => { calls++; throw new HttpError(429, "u"); }, { intervalMs: 0, retries: 2, sleep: instant }),
      HttpError,
    );
    assert.equal(calls, 3);
    calls = 0;
    await assert.rejects(mapLimited(["x"], async () => { calls++; throw new HttpError(404, "u"); }, { intervalMs: 0, sleep: instant }));
    assert.equal(calls, 1);
  });
});

describe("parseRetryAfter", () => {
  it("secondes, date HTTP, absent ou invalide", () => {
    assert.equal(parseRetryAfter("3"), 3000);
    assert.equal(parseRetryAfter("Wed, 21 Oct 2026 07:28:05 GMT", Date.parse("Wed, 21 Oct 2026 07:28:00 GMT")), 5000);
    assert.equal(parseRetryAfter(null), undefined);
    assert.equal(parseRetryAfter("bientôt"), undefined);
  });
});
