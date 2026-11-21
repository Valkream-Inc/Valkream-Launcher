/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { buildSteamGuide, clearGameSourceDir, readGameSourceDir, writeGameSourceDir } from "./game-source";

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "source-"));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("dossier de jeu choisi", () => {
  it("écrit, relit et oublie le dossier", () => {
    const game = path.join(dir, "game");
    fs.mkdirSync(game);
    assert.equal(readGameSourceDir(dir), undefined);
    writeGameSourceDir(dir, game);
    assert.equal(readGameSourceDir(dir), game);
    clearGameSourceDir(dir);
    assert.equal(readGameSourceDir(dir), undefined);
  });

  it("un dossier disparu est ignoré", () => {
    writeGameSourceDir(dir, path.join(dir, "absent"));
    assert.equal(readGameSourceDir(dir), undefined);
  });
});

describe("mode d'emploi", () => {
  it("version différente : branche, builds, fichiers et les 3 solutions", () => {
    const guide = buildSteamGuide({
      entry: "Valheim", issue: "version", appId: 892970, branch: "public-test",
      expectedBuild: 111, installedBuild: "222", files: ["valheim.exe"], depotAvailable: true,
    });
    assert.match(guide, /public-test/);
    assert.match(guide, /\*\*111\*\*.*\*\*222\*\*/);
    assert.match(guide, /valheim\.exe/);
    assert.match(guide, /Solution 1/);
    assert.match(guide, /Solution 2/);
    assert.match(guide, /Solution 3.*DepotDownloader/s);
    assert.match(guide, /steam:\/\/nav\/games\/details\/892970/);
  });

  it("jeu absent, sans depot : pas de solution 3", () => {
    const guide = buildSteamGuide({ entry: "Valheim", issue: "missing", depotAvailable: false });
    assert.match(guide, /introuvable/);
    assert.doesNotMatch(guide, /Solution 3/);
  });
});
