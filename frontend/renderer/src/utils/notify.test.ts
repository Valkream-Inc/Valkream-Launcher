/**
 * @author Valkream Team
 * @license MIT-NC
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { describeError, shortNotice, shouldNotify } from "./notify";

test("shouldNotify : seulement quand la fenêtre n'a pas le focus, sauf forcé", () => {
  assert.equal(shouldNotify(true), false);
  assert.equal(shouldNotify(false), true);
  assert.equal(shouldNotify(true, true), true);
});

test("describeError : retire le préfixe IPC d'Electron", () => {
  assert.equal(describeError(new Error("Error invoking remote method 'instances:launch': Error: Exécutable introuvable : x")), "Exécutable introuvable : x");
  assert.equal(describeError("brut"), "brut");
});

test("shortNotice : tronque les textes longs", () => {
  assert.equal(shortNotice("court"), "court");
  assert.equal(shortNotice("a".repeat(200), 10), "aaaaaaaaa…");
});
