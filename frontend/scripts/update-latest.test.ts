/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { setEntryHash } from "./update-latest";

const SAMPLE = `# commentaire d'en-tête
version: 1.0.0
game-base:
  valheim:
    type: hash_url
    # le hash est recalculé par build-manifest
    hash: old
    content: /games/x/hash/stable.json
game-details:
  mods:
    type: zip_url
    hash: keep
`;

describe("setEntryHash", () => {
  it("remplace le hash de l'entrée visée et garde commentaires et autres entrées", () => {
    const out = setEntryHash(SAMPLE, "game-base.valheim", "abc123");
    assert.match(out, /# commentaire d'en-tête/);
    assert.match(out, /# le hash est recalculé par build-manifest/);
    assert.match(out, /valheim:[\s\S]*hash: abc123/);
    assert.match(out, /mods:[\s\S]*hash: keep/);
    assert.doesNotMatch(out, /hash: old/);
  });

  it("refuse une entrée mal formée ou inconnue", () => {
    assert.throws(() => setEntryHash(SAMPLE, "valheim", "x"), /entrée invalide/);
    assert.throws(() => setEntryHash(SAMPLE, "game-base.inconnue", "x"), /introuvable/);
  });
});
