/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { cleanupInterruptedMove, getMoveProgress, isMovingGamesRoot, moveGamesRoot, readGamesRoot } from "./games-root.js";
import { applyLauncherVersion, compareVersions } from "./launcher-version.js";

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "root-"));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const seed = (root: string) => {
  fs.mkdirSync(path.join(root, "instances", "g", "stable", "game"), { recursive: true });
  fs.writeFileSync(path.join(root, "instances", "g", "stable", "game", "a.txt"), "A");
  fs.writeFileSync(path.join(root, "instances", "g", "stable", "instance.settings.json"), "{}");
};

describe("déplacement du dossier des jeux", () => {
  it("déplace les installations, enregistre le nouveau dossier, supprime l'ancien", async () => {
    const from = path.join(dir, "old");
    const to = path.join(dir, "new");
    const configFile = path.join(dir, "cfg", "paths.json");
    seed(from);
    await moveGamesRoot({ fromRoot: from, toRoot: to, configFile });
    assert.equal(fs.readFileSync(path.join(to, "instances", "g", "stable", "game", "a.txt"), "utf8"), "A");
    assert.equal(fs.existsSync(path.join(from, "instances")), false);
    assert.equal(readGamesRoot(configFile), to);
  });

  it("état de déplacement : actif pendant l'opération (lancement interdit), puis libéré, même après un échec", async () => {
    const from = path.join(dir, "old");
    seed(from);
    const states: boolean[] = [];
    const configFile = path.join(dir, "cfg", "paths.json");
    const pending = moveGamesRoot({ fromRoot: from, toRoot: path.join(dir, "new"), configFile, onProgress: (progress) => states.push(progress.active) });
    assert.equal(isMovingGamesRoot(), true);
    await assert.rejects(moveGamesRoot({ fromRoot: from, toRoot: path.join(dir, "autre"), configFile }), /déplacement|moved/i);
    await pending;
    assert.equal(isMovingGamesRoot(), false);
    assert.equal(states[0], true);
    assert.equal(states.at(-1), false);
    await assert.rejects(moveGamesRoot({ fromRoot: from, toRoot: from, configFile }));
    assert.deepEqual(getMoveProgress(), { active: false, done: 0, total: 0 });
  });

  it("refuse un dossier non vide : rien ne change", async () => {
    const from = path.join(dir, "old");
    const to = path.join(dir, "new");
    seed(from);
    fs.mkdirSync(path.join(to, "instances"), { recursive: true });
    fs.writeFileSync(path.join(to, "instances", "x"), "x");
    await assert.rejects(moveGamesRoot({ fromRoot: from, toRoot: to, configFile: path.join(dir, "p.json") }), /pas vide/);
    assert.ok(fs.existsSync(path.join(from, "instances", "g")));
    assert.equal(readGamesRoot(path.join(dir, "p.json")), undefined);
  });

  it("refuse dossier imbriqué, identique, relatif ou installation en cours", async () => {
    const from = path.join(dir, "old");
    seed(from);
    const configFile = path.join(dir, "p.json");
    await assert.rejects(moveGamesRoot({ fromRoot: from, toRoot: path.join(from, "sub"), configFile }), /intérieur/);
    await assert.rejects(moveGamesRoot({ fromRoot: from, toRoot: from, configFile }), /identique/);
    await assert.rejects(moveGamesRoot({ fromRoot: from, toRoot: "relatif", configFile }), /absolu/);
    await assert.rejects(moveGamesRoot({ fromRoot: from, toRoot: path.join(dir, "n"), configFile, isBusy: () => true }), /en cours/);
    assert.ok(fs.existsSync(path.join(from, "instances", "g")));
  });

  it("aucun jeu installé : seule la configuration change", async () => {
    const configFile = path.join(dir, "p.json");
    await moveGamesRoot({ fromRoot: path.join(dir, "old"), toRoot: path.join(dir, "new"), configFile });
    assert.equal(readGamesRoot(configFile), path.join(dir, "new"));
  });

  it("restes d'un déplacement interrompu nettoyés", () => {
    fs.mkdirSync(path.join(dir, "instances.moving"), { recursive: true });
    cleanupInterruptedMove(dir);
    assert.equal(fs.existsSync(path.join(dir, "instances.moving")), false);
  });
});

describe("version du launcher", () => {
  it("compare les versions", () => {
    assert.equal(compareVersions(undefined, "2.0.0"), "first-run");
    assert.equal(compareVersions("2.0.0", "2.0.0"), "same");
    assert.equal(compareVersions("2.0.0", "2.3.1"), "minor");
    assert.equal(compareVersions("2.9.0", "3.0.0"), "major");
  });

  it("majeure : installations supprimées, réglages conservés ; mineure : rien", () => {
    const instances = path.join(dir, "instances");
    seed(dir);
    const versionFile = path.join(dir, "launcher-version.json");
    assert.equal(applyLauncherVersion({ versionFile, instancesDir: instances, current: "2.0.0" }).change, "first-run");
    assert.equal(applyLauncherVersion({ versionFile, instancesDir: instances, current: "2.1.0" }).change, "minor");
    assert.ok(fs.existsSync(path.join(instances, "g", "stable", "game", "a.txt")));

    const result = applyLauncherVersion({ versionFile, instancesDir: instances, current: "3.0.0" });
    assert.equal(result.change, "major");
    assert.equal(result.cleaned.length, 1);
    assert.equal(fs.existsSync(path.join(instances, "g", "stable", "game")), false);
    assert.ok(fs.existsSync(path.join(instances, "g", "stable", "instance.settings.json")));
    assert.equal(applyLauncherVersion({ versionFile, instancesDir: instances, current: "3.0.0" }).change, "same");
  });
});
