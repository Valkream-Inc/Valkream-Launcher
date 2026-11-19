import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { matchesAny, matchesPattern } from "../../lib/patterns";
import { canDeleteFile, planEntryUpdate, resolvePreserved, shouldWriteFile } from "./preserve";
import { compareVersions, isValidRange, versionSatisfies } from "../../lib/version";

describe("version", () => {
  it("compare numériquement, pas en texte", () => {
    assert.equal(compareVersions("1.10.0", "1.9.0"), 1);
    assert.equal(compareVersions("1.0", "1.0.0"), 0);
    assert.equal(compareVersions("v2.0.0", "1.99.99"), 1);
    assert.equal(compareVersions("abc", "1.0.0"), null);
  });

  it("plages : comparateurs, ET, OU, jokers", () => {
    assert.equal(versionSatisfies("1.2.0", ">=1.2.0"), true);
    assert.equal(versionSatisfies("1.1.9", ">=1.2.0"), false);
    assert.equal(versionSatisfies("1.5.0", ">=1.0.0 <2.0.0"), true);
    assert.equal(versionSatisfies("2.0.0", ">=1.0.0 <2.0.0"), false);
    assert.equal(versionSatisfies("0.9.0", "<1.0.0 || >=3.0.0"), true);
    assert.equal(versionSatisfies("3.1.0", "<1.0.0 || >=3.0.0"), true);
    assert.equal(versionSatisfies("1.2.7", "1.2.x"), true);
    assert.equal(versionSatisfies("1.3.0", "1.2.x"), false);
    assert.equal(versionSatisfies("9.9.9", "*"), true);
    assert.equal(versionSatisfies("1.2.0", ">= 1.2.0"), true);
    assert.equal(versionSatisfies("1.2.0", "1.2.0"), true);
  });

  it("version illisible : faux, jamais d'exception", () => {
    assert.equal(versionSatisfies("n/a", ">=1.0.0"), false);
    assert.equal(versionSatisfies("1.0.0", "n'importe quoi"), false);
  });

  it("valide la syntaxe des plages", () => {
    for (const ok of [">=1.2.0", "1.x", "*", ">=1 <2", "<1 || >=3"]) assert.equal(isValidRange(ok), true, ok);
    for (const bad of ["", "~1.2", ">=", "latest", 3]) assert.equal(isValidRange(bad), false, String(bad));
  });
});

describe("patterns", () => {
  it("fichier exact et dossier avec son contenu", () => {
    assert.equal(matchesPattern("config/a.cfg", "config/a.cfg"), true);
    assert.equal(matchesPattern("config/a.cfg", "config"), true);
    assert.equal(matchesPattern("config/sub/a.cfg", "config/"), true);
    assert.equal(matchesPattern("config2/a.cfg", "config"), false);
    assert.equal(matchesPattern("config", "config/a.cfg"), false);
  });

  it("jokers * ** ?", () => {
    assert.equal(matchesPattern("a/x.log", "a/*.log"), true);
    assert.equal(matchesPattern("a/b/x.log", "a/*.log"), false);
    assert.equal(matchesPattern("a/b/x.log", "a/**/*.log"), true);
    assert.equal(matchesPattern("a/x.log", "a/**/*.log"), true);
    assert.equal(matchesPattern("a/x1", "a/x?"), true);
    assert.equal(matchesPattern("a/x.cfg", "a/x.c+g"), false); // + n'est pas un opérateur
  });

  it("chemins avec ./, / initial et \\", () => {
    assert.equal(matchesPattern("./config\\a.cfg", "/config/a.cfg"), true);
  });

  it("un motif vide ne couvre rien", () => {
    assert.equal(matchesPattern("a.txt", ""), false);
    assert.equal(matchesAny("a.txt", undefined), false);
  });
});

describe("conservation", () => {
  const entry = {
    gameFolderToPreserve: [
      "saves",
      { path: "config/client.cfg", from: ">=1.2.0" },
      { path: "config/old.cfg", from: "<1.0.0" },
    ],
    to_ignore: ["logs", "*.tmp"],
  };

  it("règle sans from : toujours ; avec from : selon la version installée", () => {
    assert.deepEqual(resolvePreserved(entry.gameFolderToPreserve, "1.3.0"), ["saves", "config/client.cfg"]);
    assert.deepEqual(resolvePreserved(entry.gameFolderToPreserve, "1.1.0"), ["saves"]);
    assert.deepEqual(resolvePreserved(entry.gameFolderToPreserve, "0.5.0"), ["saves", "config/old.cfg"]);
  });

  it("première installation : rien à conserver", () => {
    assert.deepEqual(resolvePreserved(entry.gameFolderToPreserve, undefined), []);
    assert.deepEqual(resolvePreserved(undefined, "1.0.0"), []);
  });

  it("écriture : conservé+présent gardé, conservé+absent fourni, ignoré jamais écrit", () => {
    const plan = planEntryUpdate(entry, "1.3.0");
    assert.equal(shouldWriteFile("config/client.cfg", plan, true), false);
    assert.equal(shouldWriteFile("config/client.cfg", plan, false), true);
    assert.equal(shouldWriteFile("config/other.cfg", plan, true), true);
    assert.equal(shouldWriteFile("logs/a.log", plan, false), false);
    assert.equal(shouldWriteFile("x.tmp", plan, false), false);
  });

  it("config incompatible (version trop ancienne) : écrasée", () => {
    const plan = planEntryUpdate(entry, "1.1.0");
    assert.equal(shouldWriteFile("config/client.cfg", plan, true), true);
  });

  it("nettoyage : ni conservé ni ignoré seulement", () => {
    const plan = planEntryUpdate(entry, "1.3.0");
    assert.equal(canDeleteFile("saves/world.db", plan), false);
    assert.equal(canDeleteFile("logs/a.log", plan), false);
    assert.equal(canDeleteFile("config/other.cfg", plan), true);
  });
});
