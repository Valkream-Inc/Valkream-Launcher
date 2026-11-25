/**
 * @author Valkream Team
 * @license MIT-NC
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { shouldNotify } from "./notify";

test("shouldNotify : seulement quand la fenêtre n'a pas le focus, sauf forcé", () => {
  assert.equal(shouldNotify(true), false);
  assert.equal(shouldNotify(false), true);
  assert.equal(shouldNotify(true, true), true);
});
