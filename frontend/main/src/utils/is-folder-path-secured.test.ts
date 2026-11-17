import assert from "node:assert/strict";
import { describe, it } from "node:test";

import isFolderPathSecured from "./is-folder-path-secured";

const root = "/data/game";
const anything = () => true;

describe("isFolderPathSecured", () => {
  it("accepte un sous-dossier autorisé", () => {
    const seen: string[] = [];
    const result = isFolderPathSecured("/BepInEx/cache", root, (relative) => {
      seen.push(relative);
      return relative === "BepInEx/cache";
    });
    assert.equal(result, true);
    assert.deepEqual(seen, ["BepInEx/cache"]);
  });

  it("refuse un dossier que le callback n'autorise pas", () => {
    assert.equal(isFolderPathSecured("/other", root, (r) => r === "BepInEx/cache"), false);
  });

  it("refuse de sortir de la racine", () => {
    assert.equal(isFolderPathSecured("../secret", root, anything), false);
    assert.equal(isFolderPathSecured("/../../etc", root, anything), false);
  });

  it("n'est pas dupe d'une racine au préfixe commun (bug startsWith)", () => {
    // /data/game2 commence par /data/game mais n'en fait pas partie.
    assert.equal(isFolderPathSecured("../game2/x", root, anything), false);
  });
});
