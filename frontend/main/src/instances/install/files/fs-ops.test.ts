import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { listFiles, removeWithPlan } from "./fs-ops.js";
import { planEntryUpdate } from "./preserve.js";

let dir: string;
beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), "fsops-")); });
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const put = (file: string) => {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), "x");
};

describe("removeWithPlan", () => {
  it("supprime le dossier demandé sauf fichiers conservés et ignorés", () => {
    ["old/a.dll", "old/keep.cfg", "old/sub/b.dll", "old/run.log", "other.txt"].forEach(put);
    const plan = planEntryUpdate({ gameFolderToPreserve: ["old/keep.cfg"], to_ignore: ["old/*.log"] }, "1.0.0");
    const removed = removeWithPlan(dir, ["old"], plan);

    assert.deepEqual(removed.sort(), ["old/a.dll", "old/sub/b.dll"]);
    assert.deepEqual(listFiles(dir).sort(), ["old/keep.cfg", "old/run.log", "other.txt"]);
    assert.equal(fs.existsSync(path.join(dir, "old/sub")), false); // dossier vide retiré
  });

  it("dossier entièrement supprimé quand rien n'est conservé", () => {
    put("old/a.dll");
    removeWithPlan(dir, ["old"], planEntryUpdate({}, "1.0.0"));
    assert.equal(fs.existsSync(path.join(dir, "old")), false);
  });

  it("chemin absent : sans effet ; chemin qui sort : refusé", () => {
    assert.deepEqual(removeWithPlan(dir, ["nope"], planEntryUpdate({}, "1")), []);
    assert.throws(() => removeWithPlan(dir, ["../hors"], planEntryUpdate({}, "1")), /hors de la racine/i);
  });
});
