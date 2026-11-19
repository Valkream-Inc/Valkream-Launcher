import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ParamResolver } from "./ParamResolver";
import {
  flattenRelease,
  isPlatformTable,
  pickPlatform,
  selectEntryPlatform,
} from "./release-options";
import { validateReleaseConfig } from "./validate";

const files: Record<string, string> = {
  "/ignore.json": JSON.stringify(["*.log", "cache"]),
  "/preserve.yml": "- client.cfg\n- path: graphics.cfg\n  from: '>=1.0.0'\n",
  "/path.txt": "game/Mods",
  "/by-platform.json": JSON.stringify({ win32: ["*.pdb"], default: ["*.log"] }),
};

const resolver = new ParamResolver({
  baseUrl: "https://files.test",
  fetchText: async (url) => {
    const key = url.replace("https://files.test", "");
    if (!(key in files)) throw new Error("404");
    return files[key];
  },
});

describe("options par plateforme", () => {
  it("reconnaît une table par plateforme, pas une donnée", () => {
    assert.equal(isPlatformTable({ win32: "a", default: "b" }), true);
    assert.equal(isPlatformTable({ path: "a" }), false);
    assert.equal(isPlatformTable(["a"]), false);
    assert.equal(isPlatformTable({}), false);
  });

  it("choisit la plateforme, sinon default, sinon rien", () => {
    const value = { win32: "/win", default: "/def" };
    assert.equal(pickPlatform(value, "win32"), "/win");
    assert.equal(pickPlatform(value, "linux"), "/def");
    assert.equal(pickPlatform({ win32: "/win" }, "darwin"), undefined);
    assert.equal(pickPlatform("/unique", "darwin"), "/unique");
  });

  it("décline toutes les options sauf version", () => {
    const entry = {
      version: "1.0.0",
      path: { win32: "game", linux: "game-linux" },
      type: "zip_url",
      content: { win32: "/w.zip", linux: "/l.zip" },
      to_ignore: { win32: ["*.pdb"], default: ["*.log"] },
      optional: { default: { setting: "boostFps" } },
    };
    assert.deepEqual(selectEntryPlatform(entry, "linux"), {
      version: "1.0.0",
      path: "game-linux",
      type: "zip_url",
      content: "/l.zip",
      to_ignore: ["*.log"],
      optional: { setting: "boostFps" },
    });
    assert.equal((selectEntryPlatform(entry, "win32") as any).to_ignore[0], "*.pdb");
  });

  it("entrée absente d'une plateforme : non proposée, sans erreur", async () => {
    const raw = {
      version: "1.0.0",
      "game-details": {
        winonly: { version: "1", path: "game", type: "zip_url", content: { win32: "/w.zip" } },
        all: { version: "1", path: "game", type: "zip_url", content: "/a.zip" },
      },
    };
    const linux = await flattenRelease(raw, "linux", resolver);
    assert.deepEqual(Object.keys(linux.release["game-details"] ?? {}), ["all"]);
    assert.deepEqual(linux.errors, []);
    const win = await flattenRelease(raw, "win32", resolver);
    assert.deepEqual(Object.keys(win.release["game-details"] ?? {}), ["winonly", "all"]);
  });
});

describe("options par lien", () => {
  it("lit les liens relatifs (JSON, YAML, texte) et valide le résultat", async () => {
    const raw = {
      version: "1.0.0",
      "game-details": {
        mods: {
          version: "1",
          path: "/path.txt",
          type: "zip_url",
          content: "/m.zip",
          to_ignore: "/ignore.json",
          gameFolderToPreserve: "https://files.test/preserve.yml",
        },
      },
    };
    const { release, errors } = await flattenRelease(raw, "win32", resolver);
    assert.deepEqual(errors, []);
    const entry = release["game-details"]!.mods;
    assert.equal(entry.path, "game/Mods");
    assert.deepEqual(entry.to_ignore, ["*.log", "cache"]);
    assert.deepEqual(entry.gameFolderToPreserve, ["client.cfg", { path: "graphics.cfg", from: ">=1.0.0" }]);
    assert.equal(validateReleaseConfig(release, ["game"]).ok, true);
  });

  it("le fichier lié peut lui-même être décliné par plateforme", async () => {
    const raw = {
      version: "1.0.0",
      "game-base": { g: { version: "1", path: "game", type: "zip_url", content: "/g.zip", to_ignore: "/by-platform.json" } },
    };
    const win = await flattenRelease(raw, "win32", resolver);
    assert.deepEqual(win.release["game-base"]!.g.to_ignore, ["*.pdb"]);
    const linux = await flattenRelease(raw, "linux", resolver);
    assert.deepEqual(linux.release["game-base"]!.g.to_ignore, ["*.log"]);
  });

  it("content, hash-folder et api-url restent des liens (pas lus comme données)", async () => {
    const raw = {
      version: "1.0.0",
      "game-base": { g: { version: "1", path: "game", type: "hash_url", content: "/missing.json", "hash-folder": "/h/" } },
    };
    const { release, errors } = await flattenRelease(raw, "win32", resolver);
    assert.deepEqual(errors, []);
    assert.equal(release["game-base"]!.g.content, "/missing.json");
    assert.equal(release["game-base"]!.g["hash-folder"], "/h/");
  });

  it("lien illisible : erreur ciblée sur l'entrée et l'option, sans exception", async () => {
    const raw = {
      version: "1.0.0",
      "game-details": { m: { version: "1", path: "game", type: "zip_url", content: "/m.zip", to_ignore: "/absent.json" } },
    };
    const { errors } = await flattenRelease(raw, "win32", resolver);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /^latest\.game-details\.m\.to_ignore : lien illisible/);
  });

  it("un lien non résolu n'ajoute pas de seconde erreur de validation", () => {
    const release = {
      version: "1.0.0",
      "game-details": { m: { version: "1", path: "game", type: "zip_url", content: "/m.zip", to_ignore: "/absent.json" } },
    };
    assert.equal(validateReleaseConfig(release as never).ok, true);
  });
});
