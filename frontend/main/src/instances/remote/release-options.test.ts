import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ParamResolver } from "./ParamResolver.js";
import {
  flattenRelease,
  isPlatformTable,
  pickPlatform,
  selectEntryPlatform,
} from "./release-options.js";
import { validateReleaseConfig } from "./validate.js";

const files: Record<string, string> = {
  "/ignore.json": JSON.stringify(["*.log", "cache"]),
  "/preserve.yml": "- client.cfg\n- path: graphics.cfg\n  from: '>=1.0.0'\n",
  "/by-platform.json": JSON.stringify({ win32: ["*.pdb"], default: ["*.log"] }),
};

/** Config main : dossier d'installation de chaque entrée (jamais lu du remote). */
const entryPaths = {
  winonly: "game",
  all: "game",
  mods: "game/Mods",
  g: "game",
  m: "game",
  perplatform: { win32: "game", linux: "game-linux" },
  nolinux: { win32: "game" },
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
      type: "zip_url",
      content: { win32: "/w.zip", linux: "/l.zip" },
      to_ignore: { win32: ["*.pdb"], default: ["*.log"] },
      optional: { default: { setting: "boostFps" } },
    };
    assert.deepEqual(selectEntryPlatform(entry, "linux"), {
      version: "1.0.0",
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
        winonly: { version: "1", type: "zip_url", content: { win32: "/w.zip" } },
        all: { version: "1", type: "zip_url", content: "/a.zip" },
      },
    };
    const linux = await flattenRelease(raw, "linux", resolver, entryPaths);
    assert.deepEqual(Object.keys(linux.release["game-details"] ?? {}), ["all"]);
    assert.deepEqual(linux.errors, []);
    const win = await flattenRelease(raw, "win32", resolver, entryPaths);
    assert.deepEqual(Object.keys(win.release["game-details"] ?? {}), ["winonly", "all"]);
  });
});

describe("dossier d'installation (config main)", () => {
  const entry = { version: "1", type: "zip_url", content: "/a.zip" };
  const run = (raw: unknown, platform: "win32" | "linux" = "win32") =>
    flattenRelease(raw, platform, resolver, entryPaths);

  it("path injecté depuis la config main, par nom d'entrée et par plateforme", async () => {
    const raw = { version: "1.0.0", "game-details": { mods: entry, perplatform: entry } };
    const win = await run(raw);
    assert.equal(win.release["game-details"]!.mods.path, "game/Mods");
    assert.equal(win.release["game-details"]!.perplatform.path, "game");
    const linux = await run(raw, "linux");
    assert.equal(linux.release["game-details"]!.perplatform.path, "game-linux");
    assert.deepEqual(win.errors, []);
  });

  it("pas de dossier main pour la plateforme : entrée non proposée", async () => {
    const raw = { version: "1.0.0", "game-details": { nolinux: entry, all: entry } };
    const linux = await run(raw, "linux");
    assert.deepEqual(Object.keys(linux.release["game-details"] ?? {}), ["all"]);
  });

  it("entrée inconnue du main : ignorée (aucune config pour elle)", async () => {
    const { release, errors } = await run({ version: "1.0.0", "game-details": { inconnue: entry, mods: entry } });
    assert.deepEqual(errors, []);
    assert.deepEqual(Object.keys(release["game-details"] ?? {}), ["mods"]);
  });

  it("entrée sans type ou sans contenu : ignorée ; type empty : conservée sans contenu", async () => {
    const { release, errors } = await run({
      version: "1.0.0",
      "game-details": {
        mods: { version: "1" },
        perplatform: { version: "1", type: "zip_url" },
        all: { version: "1", type: "empty" },
      },
    });
    assert.deepEqual(errors, []);
    assert.deepEqual(Object.keys(release["game-details"] ?? {}), ["all"]);
    assert.equal(validateReleaseConfig(release).ok, true);
  });

  it("path écrit dans le latest.yml : erreur, la valeur du main l'emporte", async () => {
    const { release, errors } = await run({ version: "1.0.0", "game-details": { mods: { ...entry, path: "../evil" } } });
    assert.match(errors.join(" "), /latest\.game-details\.mods\.path : interdit/);
    assert.equal(release["game-details"]!.mods.path, "game/Mods");
  });
});

describe("options par lien", () => {
  it("lit les liens relatifs (JSON, YAML, texte) et valide le résultat", async () => {
    const raw = {
      version: "1.0.0",
      "game-details": {
        mods: {
          version: "1",
          type: "zip_url",
          content: "/m.zip",
          to_ignore: "/ignore.json",
          gameFolderToPreserve: "https://files.test/preserve.yml",
        },
      },
    };
    const { release, errors } = await flattenRelease(raw, "win32", resolver, entryPaths);
    assert.deepEqual(errors, []);
    const entry = release["game-details"]!.mods;
    assert.equal(entry.path, "game/Mods"); // vient de la config main
    assert.deepEqual(entry.to_ignore, ["*.log", "cache"]);
    assert.deepEqual(entry.gameFolderToPreserve, ["client.cfg", { path: "graphics.cfg", from: ">=1.0.0" }]);
    assert.equal(validateReleaseConfig(release).ok, true);
  });

  it("le fichier lié peut lui-même être décliné par plateforme", async () => {
    const raw = {
      version: "1.0.0",
      "game-base": { g: { version: "1", type: "zip_url", content: "/g.zip", to_ignore: "/by-platform.json" } },
    };
    const win = await flattenRelease(raw, "win32", resolver, entryPaths);
    assert.deepEqual(win.release["game-base"]!.g.to_ignore, ["*.pdb"]);
    const linux = await flattenRelease(raw, "linux", resolver, entryPaths);
    assert.deepEqual(linux.release["game-base"]!.g.to_ignore, ["*.log"]);
  });

  it("content, hash-folder et api-url restent des liens (pas lus comme données)", async () => {
    const raw = {
      version: "1.0.0",
      "game-base": { g: { version: "1", type: "hash_url", content: "/missing.json", "hash-folder": "/h/" } },
    };
    const { release, errors } = await flattenRelease(raw, "win32", resolver, entryPaths);
    assert.deepEqual(errors, []);
    assert.equal(release["game-base"]!.g.content, "/missing.json");
    assert.equal(release["game-base"]!.g["hash-folder"], "/h/");
  });

  it("lien illisible : erreur ciblée sur l'entrée et l'option, sans exception", async () => {
    const raw = {
      version: "1.0.0",
      "game-details": { m: { version: "1", type: "zip_url", content: "/m.zip", to_ignore: "/absent.json" } },
    };
    const { errors } = await flattenRelease(raw, "win32", resolver, entryPaths);
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

describe("steam_library : depot, buildid et steam-beta par plateforme", () => {
  const entry = {
    version: 1,
    type: "steam_library",
    content: "/m.json",
    buildid: { win32: 111, linux: 222 },
    depot: { win32: { id: 892971, manifest: "1" }, linux: { id: 892972, manifest: "2" } },
  };

  it("chaque plateforme reçoit son depot (et son buildid)", () => {
    assert.deepEqual(selectEntryPlatform(entry, "win32"), { ...entry, buildid: 111, depot: { id: 892971, manifest: "1" } });
    assert.deepEqual(selectEntryPlatform(entry, "linux"), { ...entry, buildid: 222, depot: { id: 892972, manifest: "2" } });
  });

  it("plateforme sans depot : l'option est simplement absente (solution DepotDownloader non proposée)", () => {
    const darwin = selectEntryPlatform(entry, "darwin") as Record<string, unknown>;
    assert.equal("depot" in darwin, false);
  });

  it("un depot unique (non décliné) vaut pour toutes les plateformes", () => {
    const shared = { ...entry, depot: { id: 5, manifest: "9" } };
    assert.deepEqual((selectEntryPlatform(shared, "linux") as { depot: unknown }).depot, { id: 5, manifest: "9" });
  });
});
