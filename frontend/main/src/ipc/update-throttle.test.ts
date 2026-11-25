/**
 * @author Valkream Team
 * @license MIT-NC
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { createThrottle, withTimeout } from "./update-throttle.js";

test("createThrottle : un message par intervalle, force passe toujours", () => {
  let t = 0;
  const allow = createThrottle(100, () => t);
  assert.equal(allow(), true);
  t = 50;
  assert.equal(allow(), false);
  assert.equal(allow(true), true);
  t = 120;
  assert.equal(allow(), false);
  t = 160;
  assert.equal(allow(), true);
});

test("withTimeout : résout, ou rejette si trop long", async () => {
  assert.equal(await withTimeout(Promise.resolve(1), 50, "x"), 1);
  await assert.rejects(withTimeout(new Promise(() => {}), 10, "délai"), /délai/);
});
