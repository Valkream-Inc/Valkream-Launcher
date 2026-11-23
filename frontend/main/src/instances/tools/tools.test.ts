/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { manifestHash } from "../install/manifest.js";
import { exportHashFolder, exportManifestOnly, hashFolder } from "./hash-folder.js";
import { buildModsDisplay, buildNexusDisplay, parseNexusList, cdnIcon, parseModList, parsePackagePage, refsFromPackagePage } from "./mods-list.js";

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

describe("page de mod Thunderstore", () => {
  it("reconnaît les liens de page (avec ou sans communauté, avec version) et rejette le reste", () => {
    assert.deepEqual(parsePackagePage("https://thunderstore.io/c/valheim/p/DirtyGames/TheGoodCitizen/"), { origin: "https://thunderstore.io", author: "DirtyGames", name: "TheGoodCitizen", version: undefined });
    assert.deepEqual(parsePackagePage("https://thunderstore.io/package/A/B/1.2.3/"), { origin: "https://thunderstore.io", author: "A", name: "B", version: "1.2.3" });
    assert.deepEqual(parsePackagePage("https://hexium.gg/c/valheim/p/A/B/"), { origin: "https://hexium.gg", author: "A", name: "B", version: undefined });
    assert.equal(parsePackagePage("https://evil.example/c/valheim/p/A/B/"), null);
    assert.equal(parsePackagePage("http://thunderstore.io/c/valheim/p/A/B/"), null);
    assert.equal(parsePackagePage("https://thunderstore.io/c/valheim/"), null);
  });

  const api = async (url: string): Promise<unknown> => {
    assert.match(url, /^https:\/\/thunderstore\.io\/api\/experimental\/package\/DirtyGames\/TheGoodCitizen\/$/);
    return { latest: { version_number: "1.4.0", dependencies: ["denikson-BepInExPack_Valheim-5.4.2202", "A-One-1.0.0"] } };
  };

  it("mod + dépendances (dernière version), ou le mod seul", async () => {
    const page = { origin: "https://thunderstore.io", author: "DirtyGames", name: "TheGoodCitizen" };
    const all = await refsFromPackagePage(page, api);
    assert.deepEqual(all.map((ref) => `${ref.author}-${ref.name}-${ref.version}`), ["DirtyGames-TheGoodCitizen-1.4.0", "denikson-BepInExPack_Valheim-5.4.2202", "A-One-1.0.0"]);
    assert.equal((await refsFromPackagePage(page, api, undefined, false)).length, 1);
  });

  it("l'image vient du CDN quand l'API n'en donne pas ou échoue", async () => {
    const ref = { author: "A", name: "One", version: "1.0.0" };
    assert.equal(cdnIcon(ref), "https://gcdn.thunderstore.io/live/repository/icons/A-One-1.0.0.png");
    const noIcon = await buildModsDisplay([ref], async () => ({ description: "d" }));
    assert.equal(noIcon.mods[0].icon, cdnIcon(ref));
    const failing = await buildModsDisplay([ref], async () => { throw new Error("503"); });
    assert.equal(failing.mods[0].icon, cdnIcon(ref));
    const withIcon = await buildModsDisplay([ref], async () => ({ icon: "https://x/i.png" }));
    assert.equal(withIcon.mods[0].icon, "https://x/i.png");
  });
});

describe("Hexium (API compatible Thunderstore)", () => {
  it("lit la page et l'API de Hexium, sans image de repli du CDN Thunderstore", async () => {
    const urls: string[] = [];
    const api = async (url: string): Promise<unknown> => {
      urls.push(url);
      return url.includes("/1.0.0/") ? { description: "d", icon: "https://hexium.gg/i.png" } : { latest: { version_number: "1.0.0", dependencies: [] } };
    };
    const page = parsePackagePage("https://hexium.gg/c/valheim/p/A/B/")!;
    const refs = await refsFromPackagePage(page, api);
    const display = await buildModsDisplay(refs, api, page.origin);
    assert.equal(urls[0], "https://hexium.gg/api/experimental/package/A/B/");
    assert.equal(display.mods[0].link, "https://hexium.gg/package/A/B/");
    assert.equal(display.mods[0].icon, "https://hexium.gg/i.png");
    const failing = await buildModsDisplay(refs, async () => { throw new Error("503"); }, page.origin);
    assert.equal(failing.mods[0].icon, undefined);
  });
});

describe("liste Nexus", () => {
  it("reconnaît jeu-idMod-idFichier et rejette le reste", () => {
    assert.deepEqual(parseNexusList("# pack\nvalheim-1234-5678\n- valheim-1234-5678\nvalheim-9-1"), ["valheim-1234-5678", "valheim-9-1"]);
    assert.equal(parseNexusList("A-One-1.0.0"), null);
    assert.equal(parseNexusList('["valheim-1-2"]')?.length, 1);
  });

  it("nom, résumé, image et page ; un échec n'empêche pas les autres", async () => {
    const result = await buildNexusDisplay(["valheim-1-10", "valheim-2-20"], async (url) => {
      if (url.includes("/mods/2.json")) throw new Error("403");
      assert.equal(url, "https://api.nexusmods.com/v1/games/valheim/mods/1.json");
      return { name: "Cool", summary: "Un mod", picture_url: "https://img/x.png" };
    });
    assert.deepEqual(result.mods[0], { id: "valheim-1", name: "Cool", link: "https://www.nexusmods.com/valheim/mods/1", description: "Un mod", icon: "https://img/x.png" });
    assert.equal(result.mods[1].name, "Mod 2");
    assert.equal(result.failed.length, 1);
  });
});

describe("parseModList avec clé", () => {
  const manifest = JSON.stringify({ name: "pack", dependencies: ["A-One-1.0.0", "B-Two-2.0.0"], packs: [{ mods: ["C-Three-3.0.0"] }] });

  it("extrait le tableau désigné par la clé (chemin à points, index de tableau)", () => {
    assert.deepEqual(parseModList(manifest, "dependencies").map((ref) => ref.name), ["One", "Two"]);
    assert.deepEqual(parseModList(manifest, "packs.0.mods").map((ref) => ref.name), ["Three"]);
  });

  it("objet sans clé ou clé qui ne mène pas à un tableau : erreur claire", () => {
    assert.throws(() => parseModList(manifest), /clé/);
    assert.throws(() => parseModList(manifest, "name"), /tableau/);
    assert.throws(() => parseModList(manifest, "absente"), /introuvable/);
  });

  it("tableau JSON simple : clé inutile", () => {
    assert.equal(parseModList('["A-One-1.0.0"]').length, 1);
    assert.equal(parseModList('["A-One-1.0.0"]', ".").length, 1);
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
    assert.equal(result.mods[1].icon, "https://gcdn.thunderstore.io/live/repository/icons/B-Broken-1.0.0.png"); // repli CDN
    assert.equal(result.failed.length, 1);
  });

  it("signale la progression mod par mod, même quand un mod est indisponible", async () => {
    const calls: [number, number][] = [];
    const refs = parseModList("A-One-1.0.0\nB-Two-2.0.0");
    await buildModsDisplay(
      refs,
      async (url) => {
        if (url.includes("/Two/")) throw new Error("introuvable");
        return {};
      },
      undefined,
      (done, total) => calls.push([done, total]),
    );
    assert.deepEqual(calls.map(([, total]) => total), [2, 2]);
    assert.deepEqual(calls.map(([done]) => done).sort(), [1, 2]);
  });
});
