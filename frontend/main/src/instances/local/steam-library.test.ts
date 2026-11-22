/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";

import { parseVdf } from "../../lib/vdf.js";
import { locateSteamGame, type SteamLocateDeps } from "./steam-library.js";

describe("parseVdf", () => {
  it("blocs, commentaires, échappements", () => {
    const parsed = parseVdf(`
      "libraryfolders" // commentaire
      {
        "0" { "path" "C:\\\\Steam" "apps" { "892970" "123" } }
        "1" "/old/format"
      }`);
    const folders = parsed.libraryfolders as Record<string, any>;
    assert.equal(folders["0"].path, "C:\\Steam");
    assert.equal(folders["0"].apps["892970"], "123");
    assert.equal(folders["1"], "/old/format");
  });
  it("erreurs : bloc non fermé, valeur manquante", () => {
    assert.throws(() => parseVdf('"a" {'), /non fermé/);
    assert.throws(() => parseVdf('"a"'), /manquante/);
  });
});

describe("locateSteamGame", () => {
  const acf = (installdir: string, buildid: string) => `"AppState"\n{\n "appid" "892970"\n "installdir" "${installdir}"\n "buildid" "${buildid}"\n}`;
  const world = (files: Record<string, string>, platform: SteamLocateDeps["platform"] = "linux"): SteamLocateDeps => {
    const keys = Object.keys(files).map((file) => path.normalize(file));
    const dirs = new Set(keys.flatMap((file) => { const parts = file.split(path.sep); return parts.map((_p, i) => parts.slice(0, i + 1).join(path.sep) || path.sep); }));
    return {
      platform, home: "/home/u", env: {},
      exists: (file) => dirs.has(path.normalize(file)),
      readFile: (file) => files[file] ?? files[path.normalize(file)],
      registrySteamPath: async () => undefined,
    };
  };

  it("jeu dans la bibliothèque principale", async () => {
    const deps = world({
      "/home/u/.steam/steam/steamapps/appmanifest_892970.acf": acf("Valheim", "777"),
      "/home/u/.steam/steam/steamapps/common/Valheim/valheim.x86_64": "x",
    });
    assert.deepEqual(await locateSteamGame(892970, deps), { dir: "/home/u/.steam/steam/steamapps/common/Valheim", buildId: "777" });
  });

  it("jeu dans une seconde bibliothèque (libraryfolders.vdf)", async () => {
    const deps = world({
      "/home/u/.steam/steam/steamapps/libraryfolders.vdf": '"libraryfolders" { "0" { "path" "/games/lib" } }',
      "/games/lib/steamapps/appmanifest_892970.acf": acf("Valheim", "42"),
      "/games/lib/steamapps/common/Valheim/a": "x",
    });
    assert.equal((await locateSteamGame(892970, deps))?.buildId, "42");
  });

  it("introuvable, ou installdir suspect : null", async () => {
    assert.equal(await locateSteamGame(1, world({})), null);
    const deps = world({
      "/home/u/.steam/steam/steamapps/appmanifest_892970.acf": acf("../etc", "1"),
      "/home/u/.steam/steam/steamapps/common/x": "x",
    });
    assert.equal(await locateSteamGame(892970, deps), null);
  });
});
