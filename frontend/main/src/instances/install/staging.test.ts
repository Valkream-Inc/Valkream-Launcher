/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { commitStaged, stageFile } from "./staging.js";

let root: string;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "staging-"));
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

const write = (file: string, text: string) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};

describe("commitStaged", () => {
  it("bascule les fichiers (sous-dossiers compris), écrase l'existant, garde le reste", () => {
    const stage = path.join(root, "stage");
    const dest = path.join(root, "game");
    write(path.join(stage, "bin/game.exe"), "v2");
    write(path.join(stage, "data/new.txt"), "n");
    write(path.join(dest, "bin/game.exe"), "v1");
    write(path.join(dest, "saves/me.sav"), "save");

    const seen: string[] = [];
    commitStaged(stage, dest, (relative) => seen.push(relative));

    assert.equal(fs.readFileSync(path.join(dest, "bin/game.exe"), "utf8"), "v2");
    assert.equal(fs.readFileSync(path.join(dest, "data/new.txt"), "utf8"), "n");
    assert.equal(fs.readFileSync(path.join(dest, "saves/me.sav"), "utf8"), "save");
    assert.equal(fs.existsSync(stage), false);
    assert.deepEqual(seen.sort(), ["bin/game.exe", "data/new.txt"]);
  });

  it("dossier de préparation absent : sans effet", () => {
    commitStaged(path.join(root, "nope"), path.join(root, "game"));
    assert.equal(fs.existsSync(path.join(root, "game")), false);
  });

  it("un fichier remplace un dossier de même nom", () => {
    const stage = path.join(root, "stage");
    const dest = path.join(root, "game");
    write(path.join(stage, "x"), "fichier");
    write(path.join(dest, "x/inner.txt"), "dossier");
    commitStaged(stage, dest);
    assert.equal(fs.readFileSync(path.join(dest, "x"), "utf8"), "fichier");
  });
});

describe("stageFile", () => {
  it("déplace un fichier prêt dans la préparation", () => {
    const source = path.join(root, "a.part");
    write(source, "ok");
    stageFile(source, path.join(root, "stage"), "dir/a.txt");
    assert.equal(fs.readFileSync(path.join(root, "stage/dir/a.txt"), "utf8"), "ok");
    assert.equal(fs.existsSync(source), false);
  });
});
