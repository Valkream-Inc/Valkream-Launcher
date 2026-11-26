/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { removeTreeWithProgress, type RemoveProgress } from "./remove-progress";

describe("removeTreeWithProgress", () => {
  it("supprime tout et rapporte une progression croissante jusqu'au total", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "rm-progress-"));
    const dir = path.join(root, "game");
    for (let i = 0; i < 60; i++) {
      fs.mkdirSync(path.join(dir, `d${i % 5}`, "sub"), { recursive: true });
      fs.writeFileSync(path.join(dir, `d${i % 5}`, "sub", `f${i}.txt`), "x");
    }
    const seen: RemoveProgress[] = [];
    await removeTreeWithProgress(dir, (p) => seen.push(p));
    assert.equal(fs.existsSync(dir), false);
    assert.equal(seen[0].done, 0);
    assert.ok(seen[0].total > 60);
    const last = seen[seen.length - 1];
    assert.equal(last.done, last.total);
    for (let i = 1; i < seen.length; i++) assert.ok(seen[i].done >= seen[i - 1].done);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it("un dossier absent n'est pas une erreur", async () => {
    const seen: RemoveProgress[] = [];
    await removeTreeWithProgress(path.join(os.tmpdir(), "inexistant-rm-progress"), (p) => seen.push(p));
    assert.deepEqual(seen, [{ done: 0, total: 0 }]);
  });
});
