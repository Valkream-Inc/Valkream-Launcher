/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { manifestHash } from "../install/manifest";
import { exportHashFolder, exportManifestOnly, hashFolder } from "./hash-folder";
import { buildModsDisplay, parseModList } from "./mods-list";

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "tools-"));
  fs.mkdirSync(path.join(dir, "src", "sub"), { recursive: true });
  fs.writeFileSync(path.join(dir, "src", "a.txt"), "aaa");
  fs.writeFileSync(path.join(dir, "src", "sub", "b.txt"), "bb");
  fs.writeFileSync(path.join(dir, "src", "local.cfg"), "perso");
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("hashFolder / exportHashFolder", () => {
  it("hash identique à manifestHash et motifs ignorés exclus", async () => {
    const result = await hashFolder(path.join(dir, "src"), ["*.cfg"]);
    assert.deepEqual(Object.keys(result.manifest).sort(), ["a.txt", "sub/b.txt"]);
    assert.equal(result.fileCount, 2);
    assert.equal(result.totalBytes, 5);
    assert.equal(result.hash, manifestHash(result.manifest));
  });

  it("export : hash.json + copie des fichiers", async () => {
    const out = path.join(dir, "out");
    await exportHashFolder(path.join(dir, "src"), out, ["*.cfg"]);
    assert.ok(fs.existsSync(path.join(out, "hash", "sub", "b.txt")));
    assert.ok(!fs.existsSync(path.join(out, "hash", "local.cfg")));
    assert.deepEqual(Object.keys(JSON.parse(fs.readFileSync(path.join(out, "hash.json"), "utf8"))).sort(), ["a.txt", "sub/b.txt"]);
  });

  it("manifest-only : hash.json seulement, aucun fichier copié (jeu commercial)", async () => {
    const out = path.join(dir, "out2");
    const result = await exportManifestOnly(path.join(dir, "src"), out, ["*.cfg"]);
    assert.deepEqual(fs.readdirSync(out), ["hash.json"]);
    assert.equal(result.fileCount, 2);
  });

  it("dossier absent : erreur claire", async () => {
    await assert.rejects(hashFolder(path.join(dir, "nope")), /introuvable/);
  });
});

describe("parseModList", () => {
  it("lignes, commentaires, puces et doublons", () => {
    const refs = parseModList("# modpack\nBepInEx-BepInExPack_Valheim-5.4.2202\n- Author-Mod-1.0.0 # note\n\nAuthor-Mod-1.0.1\n");
    assert.deepEqual(refs.map((r) => `${r.author}/${r.name}/${r.version}`), [
      "BepInEx/BepInExPack_Valheim/5.4.2202",
      "Author/Mod/1.0.0",
    ]);
  });

  it("tableau JSON", () => {
    assert.equal(parseModList('["A-B-1.0.0","C-D-2.0.0"]').length, 2);
  });

  it("dépendance invalide : rejet", () => {
    assert.throws(() => parseModList("nimportequoi"), /invalide/);
  });
});

describe("buildModsDisplay", () => {
  it("image, description et lien ; un échec n'empêche pas les autres", async () => {
    const result = await buildModsDisplay(
      parseModList("A-Cool_Mod-1.0.0\nB-Broken-1.0.0"),
      async (url) => {
        if (url.includes("/B/")) throw new Error("HTTP 404");
        return { description: "Un mod", icon: "https://cdn/x.png" };
      },
    );
    assert.deepEqual(result.mods[0], {
      id: "A-Cool_Mod",
      name: "Cool Mod",
      link: "https://thunderstore.io/package/A/Cool_Mod/",
      icon: "https://cdn/x.png",
      description: "Un mod",
    });
    assert.equal(result.mods[1].icon, undefined);
    assert.equal(result.failed.length, 1);
  });
});
