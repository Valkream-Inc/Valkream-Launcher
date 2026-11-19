import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";

import {
  instanceRootPath,
  isPathInside,
  isSafeRelativePath,
  isSafeSegment,
  resolveInside,
} from "./paths";

describe("isPathInside", () => {
  it("accepte la racine et ses descendants", () => {
    assert.equal(isPathInside("/data/game", "/data/game"), true);
    assert.equal(isPathInside("/data/game", "/data/game/BepInEx/plugins"), true);
  });

  it("refuse un dossier frère au préfixe identique (bug startsWith)", () => {
    assert.equal(isPathInside("/data/game", "/data/game2"), false);
    assert.equal(isPathInside("/data/game", "/data/game2/x"), false);
  });

  it("refuse la sortie par « .. » et les chemins ailleurs", () => {
    assert.equal(isPathInside("/data/game", "/data/game/../secret"), false);
    assert.equal(isPathInside("/data/game", "/etc/passwd"), false);
    assert.equal(isPathInside("/data/game", "/data"), false);
  });

  it("accepte un dossier dont le nom commence par deux points", () => {
    assert.equal(isPathInside("/data/game", "/data/game/..cache"), true);
  });
});

describe("resolveInside", () => {
  it("résout un chemin relatif, avec ou sans « / » initial", () => {
    assert.equal(resolveInside("/data/game", "/BepInEx/cache"), path.resolve("/data/game/BepInEx/cache"));
    assert.equal(resolveInside("/data/game", "BepInEx/cache"), path.resolve("/data/game/BepInEx/cache"));
  });

  it("lève si le résultat sort de la racine", () => {
    assert.throws(() => resolveInside("/data/game", "../secret"), /hors de la racine/);
    assert.throws(() => resolveInside("/data/game", "/a/../../secret"), /hors de la racine/);
  });
});

describe("isSafeSegment", () => {
  it("accepte des identifiants d'instance", () => {
    assert.equal(isSafeSegment("Valheim-Valkream-v2"), true);
    assert.equal(isSafeSegment("SevenDtoD.test_1"), true);
  });

  it("refuse séparateurs, « .. » et noms vides", () => {
    for (const bad of ["", "..", "a/b", "a\\b", "../x", ".hidden", "a..b", "a b"]) {
      assert.equal(isSafeSegment(bad), false, bad);
    }
  });
});

describe("isSafeRelativePath", () => {
  it("accepte les chemins relatifs, « / » initial toléré", () => {
    for (const ok of ["game", "/BepInEx/config", "game/BepInEx/plugins", "/"]) {
      assert.equal(isSafeRelativePath(ok), true, ok);
    }
  });

  it("refuse « .. », lecteurs, UNC et vide", () => {
    for (const bad of ["", "  ", "../x", "a/../../x", "a\\..\\x", "C:\\Windows", "//host/share", "\\\\host\\share", "a\0b"]) {
      assert.equal(isSafeRelativePath(bad), false, JSON.stringify(bad));
    }
  });
});

describe("instanceRootPath", () => {
  it("sépare stable et beta", () => {
    assert.equal(instanceRootPath("/root", "Valheim-v2", "stable"), path.join("/root", "instances", "Valheim-v2", "stable"));
    assert.equal(instanceRootPath("/root", "Valheim-v2", "beta"), path.join("/root", "instances", "Valheim-v2", "beta"));
  });

  it("refuse un id qui pourrait sortir de la racine", () => {
    assert.throws(() => instanceRootPath("/root", "../etc", "stable"), /invalide/);
  });
});
