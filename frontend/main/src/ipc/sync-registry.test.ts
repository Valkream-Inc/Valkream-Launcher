/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { abortAllSyncs, cancelSync, isSyncRunning, runSync } from "./sync-registry.js";

const untilAborted = (signal: AbortSignal) =>
  new Promise<string>((resolve) => signal.addEventListener("abort", () => resolve("aborted"), { once: true }));

describe("sync-registry", () => {
  it("une relance annule la synchro bloquée et démarre aussitôt", async () => {
    const first = runSync("a", untilAborted);
    const second = await runSync("a", async () => "ok");
    assert.equal(await first, "aborted");
    assert.equal(second, "ok");
    assert.equal(isSyncRunning("a"), false);
  });

  it("une synchro qui plante libère la place et coupe son signal", async () => {
    let signal!: AbortSignal;
    await assert.rejects(
      runSync("b", async (s) => {
        signal = s;
        throw new Error("boom");
      }),
      /boom/,
    );
    assert.equal(signal.aborted, true);
    assert.equal(isSyncRunning("b"), false);
    assert.equal(await runSync("b", async () => 1), 1);
  });

  it("une synchro qui ignore l'annulation n'empêche pas la relance (délai dépassé)", async () => {
    const stuck = new Promise<void>(() => {});
    void runSync("c", () => stuck).catch(() => undefined);
    assert.equal(await runSync("c", async () => "next", 20), "next");
  });

  it("cancelSync et abortAllSyncs coupent les synchros actives", async () => {
    const x = runSync("x", untilAborted);
    const y = runSync("y", untilAborted);
    cancelSync("x");
    assert.equal(await x, "aborted");
    abortAllSyncs();
    assert.equal(await y, "aborted");
  });
});
