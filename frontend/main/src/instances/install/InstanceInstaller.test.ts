import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import type { InstanceMainConfig } from "../instances.types";
import { InstanceInspector } from "../local/InstanceInspector";
import { InstanceInstaller } from "./InstanceInstaller";
import { readInstallState, writeInstanceSetting } from "./install-store";
import { manifestHash } from "./manifest";
import { instanceRootPath } from "../../lib/paths";
import type { ParamResolver } from "../remote/ParamResolver";
import type { InstallIO } from "./providers/types";

const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const config: InstanceMainConfig = {
  id: "g",
  server: { type: "valheim", host: "h", port: 1, timeout: 1 },
  indexUrl: "/index.json",
  entryPaths: { base: "game", cfg: "game/config", mods: "game/plugins", normal: "game/plugins", admin: "game/plugins", n: "game" },
};

/** Réseau simulé : URL → contenu texte. Les « zips » sont de simples JSON { fichier: contenu }. */
const makeWorld = (remote: Record<string, unknown>, files: Record<string, string>) => {
  const downloads: string[] = [];
  const resolver = {
    urlOf: (link: string) => (link.startsWith("http") ? link : `https://files.test${link}`),
    getJson: async (param: unknown) => {
      if (typeof param !== "string") return { value: param, source: "inline" };
      if (!(param in remote)) throw new Error(`404 ${param}`);
      return { value: remote[param], source: "online" };
    },
    getYaml: async (link: string) => {
      if (!(link in remote)) throw new Error(`404 ${link}`);
      return { value: remote[link], source: "online" };
    },
  } as unknown as ParamResolver;

  const io: InstallIO = {
    download: async (url, destination) => {
      downloads.push(url);
      const key = url.replace("https://files.test", "");
      if (!(key in files)) throw new Error(`404 ${url}`);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, files[key]);
    },
    extract: async (zipPath, outDir, { folderInZip, accept }) => {
      const archive = JSON.parse(fs.readFileSync(zipPath, "utf8")) as Record<string, string>;
      const prefix = folderInZip ? folderInZip.replace(/^\/+|\/+$/g, "") + "/" : "";
      for (const [file, content] of Object.entries(archive)) {
        if (prefix && !file.startsWith(prefix)) continue;
        const relative = file.slice(prefix.length);
        if (!accept(relative)) continue;
        fs.mkdirSync(path.dirname(path.join(outDir, relative)), { recursive: true });
        fs.writeFileSync(path.join(outDir, relative), content);
      }
    },
  };
  return { resolver, io, downloads };
};

let root: string;
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), "installer-")); });
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

const build = (remote: Record<string, unknown>, files: Record<string, string>) => {
  const world = makeWorld(remote, files);
  const inspector = new InstanceInspector({
    configs: [config], resolver: world.resolver, platform: "win32", rootPath: () => root,
  });
  const installer = new InstanceInstaller({ inspector, resolver: world.resolver, platform: "win32", io: world.io });
  return { ...world, installer, inspector };
};

const index = (channels: Record<string, string>) => ({
  schemaVersion: 1,
  id: "g",
  enabled: { win32: true },
  channels,
});
const dir = (channel: "stable" | "beta") => instanceRootPath(root, "g", channel);
const read = (channel: "stable" | "beta", file: string) =>
  fs.readFileSync(path.join(dir(channel), file), "utf8");

describe("InstanceInstaller", () => {
  const manifest = { "bin/game.exe": sha("exe-v1"), "data/a.txt": sha("a"), "logs/run.log": sha("log") };
  const baseRemote = () => ({
    "/index.json": index({ stable: "/stable.yml" }),
    "/stable.yml": {
      version: "1.0.0",
      "game-base": {
        base: {
          version: "1.0.0", type: "hash_url", "hash-folder": "/h/",
          content: "/manifest.json", to_ignore: ["logs"], hash: manifestHash(manifest, ["logs"]),
        },
      },
      "game-details": {
        cfg: {
          version: "1.0.0", type: "zip_url", content: "/cfg.zip", folder_in_zip: "config",
          gameFolderToPreserve: ["client.cfg", { path: "graphics.cfg", from: ">=1.0.0" }],
        },
      },
    },
    "/manifest.json": manifest,
  });
  const files = {
    "/h/bin/game.exe": "exe-v1", "/h/data/a.txt": "a", "/h/logs/run.log": "log",
    "/cfg.zip": JSON.stringify({ "config/client.cfg": "default-client", "config/graphics.cfg": "default-gfx", "config/new.cfg": "n" }),
  };

  it("installation complète : fichiers en place, état enregistré, jeu jouable", async () => {
    const { installer } = build(baseRemote(), files);
    const result = await installer.sync("g", "stable");

    assert.deepEqual(result.failed, []);
    assert.deepEqual(result.installed, ["base", "cfg"]);
    assert.equal(result.works, true);
    assert.equal(read("stable", "game/bin/game.exe"), "exe-v1");
    assert.equal(read("stable", "game/config/client.cfg"), "default-client");
    assert.equal(fs.existsSync(path.join(dir("stable"), "game/logs/run.log")), false); // to_ignore : jamais téléchargé
    assert.equal(fs.existsSync(path.join(dir("stable"), ".tmp")), false);
    assert.equal(readInstallState(dir("stable")).entries.base.version, "1.0.0");
  });

  it("deuxième passage : rien à faire, aucun téléchargement", async () => {
    const { installer, downloads } = build(baseRemote(), files);
    await installer.sync("g", "stable");
    downloads.length = 0;
    const again = await installer.sync("g", "stable");
    assert.deepEqual(again.installed, []);
    assert.deepEqual(downloads, []);
  });

  it("mise à jour : la config client conservée n'est pas écrasée, les autres le sont", async () => {
    const { installer } = build(baseRemote(), files);
    await installer.sync("g", "stable");
    fs.writeFileSync(path.join(dir("stable"), "game/config/client.cfg"), "perso-client");
    fs.writeFileSync(path.join(dir("stable"), "game/config/graphics.cfg"), "perso-gfx");

    const remote = baseRemote() as Record<string, any>;
    remote["/stable.yml"]["game-details"].cfg.version = "2.0.0";
    const updated = build(remote, files);
    await updated.installer.sync("g", "stable");

    assert.equal(read("stable", "game/config/client.cfg"), "perso-client"); // toujours conservé
    assert.equal(read("stable", "game/config/graphics.cfg"), "perso-gfx"); // installé en 1.0.0 : >=1.0.0
    assert.equal(read("stable", "game/config/new.cfg"), "n");
  });

  it("config trop ancienne pour la règle `from` : écrasée par la nouvelle version", async () => {
    const { installer } = build(baseRemote(), files);
    await installer.sync("g", "stable");
    fs.writeFileSync(path.join(dir("stable"), "game/config/graphics.cfg"), "ancien-format");
    // Simule une installation en 0.5.0 (avant la compatibilité)
    const statePath = path.join(dir("stable"), "instance.state.json");
    const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
    state.entries.cfg.version = "0.5.0";
    fs.writeFileSync(statePath, JSON.stringify(state));

    await installer.sync("g", "stable");
    assert.equal(read("stable", "game/config/graphics.cfg"), "default-gfx");
  });

  it("réparation : un fichier supprimé ou modifié est retéléchargé seulement avec repair", async () => {
    const { installer } = build(baseRemote(), files);
    await installer.sync("g", "stable");
    fs.rmSync(path.join(dir("stable"), "game/bin/game.exe"));
    fs.writeFileSync(path.join(dir("stable"), "game/data/a.txt"), "abîmé");

    await installer.sync("g", "stable");
    assert.equal(fs.existsSync(path.join(dir("stable"), "game/bin/game.exe")), false); // statut « à jour » : rien à faire

    const result = await installer.sync("g", "stable", { repair: true });
    assert.deepEqual(result.installed, ["base"]);
    assert.equal(read("stable", "game/bin/game.exe"), "exe-v1");
    assert.equal(read("stable", "game/data/a.txt"), "a");
  });

  it("hash_url : un fichier corrompu est refusé et l'entrée n'est pas enregistrée", async () => {
    const { installer } = build(baseRemote(), { ...files, "/h/data/a.txt": "CORROMPU" });
    const result = await installer.sync("g", "stable");
    assert.equal(result.failed[0].name, "base");
    assert.match(result.failed[0].error, /hash invalide/);
    assert.deepEqual(readInstallState(dir("stable")).entries, {}); // base échoue : cfg n'est pas tentée
    assert.equal(result.works, false);
  });

  it("manifeste modifié par rapport au hash déclaré : refusé", async () => {
    const remote = baseRemote() as Record<string, any>;
    remote["/manifest.json"] = { ...manifest, "data/a.txt": sha("autre") };
    const { installer } = build(remote, files);
    const result = await installer.sync("g", "stable");
    assert.match(result.failed[0].error, /manifeste/);
  });

  it("beta : installation indépendante du stable", async () => {
    const remote = baseRemote() as Record<string, any>;
    remote["/index.json"] = index({ stable: "/stable.yml", beta: "/beta.yml" });
    remote["/beta.yml"] = {
      version: "1.1.0",
      "game-details": { cfg: { version: "9.0.0", type: "zip_url", content: "/cfg.zip", folder_in_zip: "config" } },
    };
    const { installer } = build(remote, files);
    await installer.sync("g", "stable");
    await installer.sync("g", "beta");

    assert.equal(readInstallState(dir("stable")).entries.cfg.version, "1.0.0");
    assert.equal(readInstallState(dir("beta")).entries.cfg.version, "9.0.0");
    assert.equal(fs.existsSync(path.join(dir("beta"), "game/bin/game.exe")), false);
  });

  it("thunderstore : un dossier par mod, mod retiré supprimé, mods d'une autre entrée intacts", async () => {
    const remote: Record<string, any> = {
      "/index.json": index({ stable: "/stable.yml" }),
      "/stable.yml": {
        version: "1.0.0",
        "game-details": {
          mods: { version: "1", type: "thunderstore_modpack_url", "api-url": "https://thunderstore.io", content: ["Au-ModA-1.0.0", "Au-ModB-2.0.0"] },
        },
      },
    };
    const mod = (text: string) => JSON.stringify({ "plugin.dll": text });
    const f = {
      "https://thunderstore.io/package/download/Au/ModA/1.0.0/": mod("A1"),
      "https://thunderstore.io/package/download/Au/ModB/2.0.0/": mod("B2"),
      "https://thunderstore.io/package/download/Au/ModB/3.0.0/": mod("B3"),
    };
    const w2 = makeWorld(remote, {});
    w2.io.download = async (url, dest) => {
      const body = f[url as keyof typeof f];
      if (!body) throw new Error(`404 ${url}`);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, body);
    };
    const inspector = new InstanceInspector({ configs: [config], resolver: w2.resolver, platform: "win32", rootPath: () => root });
    const installer = new InstanceInstaller({ inspector, resolver: w2.resolver, platform: "win32", io: w2.io });

    const first = await installer.sync("g", "stable");
    assert.deepEqual(first.failed, []);
    assert.equal(read("stable", "game/plugins/Au-ModA/plugin.dll"), "A1");
    // fichier d'une AUTRE entrée dans le même dossier : ne doit jamais être touché
    fs.mkdirSync(path.join(dir("stable"), "game/plugins/Autre-Mod"), { recursive: true });
    fs.writeFileSync(path.join(dir("stable"), "game/plugins/Autre-Mod/x.dll"), "autre");

    remote["/stable.yml"]["game-details"].mods = { ...remote["/stable.yml"]["game-details"].mods, version: "2", content: ["Au-ModB-3.0.0"] };
    await installer.sync("g", "stable");
    assert.equal(fs.existsSync(path.join(dir("stable"), "game/plugins/Au-ModA")), false);
    assert.equal(read("stable", "game/plugins/Au-ModB/plugin.dll"), "B3");
    assert.equal(read("stable", "game/plugins/Autre-Mod/x.dll"), "autre");
  });

  it("entrée optionnelle désactivée : ses mods sont retirés, ceux des autres entrées restent", async () => {
    const remote: Record<string, any> = {
      "/index.json": index({ stable: "/stable.yml" }),
      "/stable.yml": {
        version: "1.0.0",
        "game-details": {
          normal: { version: "1", type: "thunderstore_modpack_url", content: ["Au-Normal-1.0.0"] },
          admin: { version: "1", type: "thunderstore_modpack_url", content: ["Au-Admin-1.0.0"], optional: { setting: "modsAdmin" } },
        },
      },
    };
    const body = JSON.stringify({ "plugin.dll": "x" });
    const w = makeWorld(remote, {});
    w.io.download = async (_url, dest) => {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, body);
    };
    const inspector = new InstanceInspector({ configs: [config], resolver: w.resolver, platform: "win32", rootPath: () => root });
    const installer = new InstanceInstaller({ inspector, resolver: w.resolver, platform: "win32", io: w.io });

    writeInstanceSetting(dir("stable"), "modsAdmin", true);
    await installer.sync("g", "stable");
    assert.equal(fs.existsSync(path.join(dir("stable"), "game/plugins/Au-Admin/plugin.dll")), true);

    writeInstanceSetting(dir("stable"), "modsAdmin", false);
    const status = await inspector.report("g", "stable");
    assert.equal(status.entries[1].pendingRemoval, true); // proposé à l'utilisateur comme une mise à jour
    await installer.sync("g", "stable");

    assert.equal(fs.existsSync(path.join(dir("stable"), "game/plugins/Au-Admin")), false);
    assert.equal(fs.existsSync(path.join(dir("stable"), "game/plugins/Au-Normal/plugin.dll")), true);
    assert.equal("admin" in readInstallState(dir("stable")).entries, false);
    assert.equal((await inspector.report("g", "stable")).entries[1].status, "skipped");
  });

  it("type non pris en charge (nexus) : échec signalé, pas d'exception", async () => {
    const remote: Record<string, any> = {
      "/index.json": index({ stable: "/stable.yml" }),
      "/stable.yml": { version: "1.0.0", "game-details": { n: { version: "1", type: "nexus_modpack_url", content: "/x.json" } } },
    };
    const { installer } = build(remote, {});
    const result = await installer.sync("g", "stable");
    assert.match(result.failed[0].error, /non pris en charge/);
  });

  it("deux synchronisations simultanées : la seconde est refusée", async () => {
    const { installer } = build(baseRemote(), files);
    const first = installer.sync("g", "stable");
    await assert.rejects(() => installer.sync("g", "stable"), /déjà en cours/);
    await first;
  });

  describe("hash_url avec archive `zip`", () => {
    const zipRemote = () => {
      const remote = baseRemote() as Record<string, any>;
      remote["/stable.yml"]["game-base"].base.zip = "/base.zip";
      return remote;
    };
    const zipFiles = (archive: Record<string, string>) => ({
      ...files,
      "/base.zip": JSON.stringify(archive),
    });

    it("installation complète : une archive, aucun fichier téléchargé un par un", async () => {
      const { installer, downloads } = build(
        zipRemote(),
        zipFiles({ "bin/game.exe": "exe-v1", "data/a.txt": "a", "logs/run.log": "log" }),
      );
      const result = await installer.sync("g", "stable");

      assert.deepEqual(result.failed, []);
      assert.equal(read("stable", "game/bin/game.exe"), "exe-v1");
      assert.equal(read("stable", "game/data/a.txt"), "a");
      assert.equal(fs.existsSync(path.join(dir("stable"), "game/logs/run.log")), false); // to_ignore
      assert.deepEqual(downloads.filter((url) => url.includes("/h/")), []);
      assert.equal(downloads.filter((url) => url.endsWith("/base.zip")).length, 1);
    });

    it("fichier absent ou corrompu dans l'archive : repris via hash-folder", async () => {
      const { installer, downloads } = build(
        zipRemote(),
        zipFiles({ "bin/game.exe": "CORROMPU" }), // data/a.txt manque dans l'archive
      );
      const result = await installer.sync("g", "stable");

      assert.deepEqual(result.failed, []);
      assert.equal(read("stable", "game/bin/game.exe"), "exe-v1");
      assert.equal(read("stable", "game/data/a.txt"), "a");
      assert.deepEqual(
        downloads.filter((url) => url.includes("/h/")).sort(),
        ["https://files.test/h/bin/game.exe", "https://files.test/h/data/a.txt"],
      );
    });

    it("mise à jour d'un seul fichier : pas d'archive, seulement ce fichier", async () => {
      const { installer, downloads } = build(zipRemote(), zipFiles({}));
      await installer.sync("g", "stable");
      fs.writeFileSync(path.join(dir("stable"), "game/data/a.txt"), "casse");
      downloads.length = 0;

      await installer.sync("g", "stable", { repair: true });
      assert.equal(read("stable", "game/data/a.txt"), "a");
      assert.equal(downloads.some((url) => url.endsWith(".zip")), false);
    });
  });

  it("les hash vérifiés sont mémorisés dans instance.hashes.json", async () => {
    const { installer, inspector } = build(baseRemote(), files);
    await installer.sync("g", "stable");

    const cache = JSON.parse(read("stable", "instance.hashes.json"));
    assert.equal(cache.files["game/bin/game.exe"].hash, sha("exe-v1"));

    // Vérification : fichier inchangé = hash du cache (même corrompu dans le cache, il est cru) ;
    // `fresh` (réparation) relit vraiment le disque.
    cache.files["game/data/a.txt"].hash = sha("faux");
    fs.writeFileSync(path.join(dir("stable"), "instance.hashes.json"), JSON.stringify(cache));
    assert.equal((await inspector.report("g", "stable", { verify: true })).entries[0].status, "modified");
    const fresh = await inspector.report("g", "stable", { verify: true, fresh: true });
    assert.equal(fresh.entries[0].status, "up-to-date");
  });

  it("écrit un journal d'installation (début, fin, erreur)", async () => {
    const { installer } = build(baseRemote(), files);
    await installer.sync("g", "stable");
    const log = read("stable", "instance.log");
    assert.match(log, /\[stable\] synchronisation : \d+ entrée\(s\)/);
    assert.match(log, /\[stable\] base start/);
    assert.match(log, /\[stable\] base done/);
  });

  it("annulation : signal déjà annulé = rien n'est traité, pas d'échec", async () => {
    const { installer } = build(baseRemote(), files);
    const controller = new AbortController();
    controller.abort();
    const result = await installer.sync("g", "stable", { signal: controller.signal });
    assert.equal(result.cancelled, true);
    assert.deepEqual(result.installed, []);
    assert.deepEqual(result.failed, []);
  });

  it("annulation pendant la synchro : l'entrée en cours n'est pas comptée en échec", async () => {
    const { installer } = build(baseRemote(), files);
    const controller = new AbortController();
    const result = await installer.sync("g", "stable", {
      signal: controller.signal,
      onProgress: (progress) => {
        if (progress.step === "start") controller.abort();
      },
    });
    assert.equal(result.cancelled, true);
    assert.deepEqual(result.failed, []);
  });

  describe("espace disque", () => {
    const withSpace = (freeMb: number) => {
      const remote = baseRemote() as Record<string, any>;
      remote["/index.json"].requiredSpaceMb = 1000;
      const world = makeWorld({ ...remote }, files);
      const inspector = new InstanceInspector({ configs: [config], resolver: world.resolver, platform: "win32", rootPath: () => root });
      return new InstanceInstaller({
        inspector, resolver: world.resolver, platform: "win32", io: world.io,
        freeSpace: () => freeMb * 1024 ** 2,
      });
    };

    it("refuse une première installation sans assez de place", async () => {
      await assert.rejects(withSpace(10).sync("g", "stable"), /espace disque insuffisant : 10 Mo libres, 1000 Mo/);
      assert.equal(fs.existsSync(path.join(dir("stable"), "game")), false);
    });

    it("installe quand l'espace suffit", async () => {
      const result = await withSpace(5000).sync("g", "stable");
      assert.deepEqual(result.failed, []);
      assert.equal(read("stable", "game/bin/game.exe"), "exe-v1");
    });
  });

  describe("thunderstore : dépendances transitives", () => {
    const pack = (text: string, dependencies: string[]) =>
      JSON.stringify({ "plugin.dll": text, "manifest.json": JSON.stringify({ dependencies }) });

    const setup = (dependencies?: { skip?: string[] }) => {
      const remote: Record<string, any> = {
        "/index.json": index({ stable: "/stable.yml" }),
        "/stable.yml": {
          version: "1.0.0",
          "game-details": {
            mods: {
              version: "1", type: "thunderstore_modpack_url", content: ["Au-Top-1.0.0"],
              ...(dependencies ? { dependencies } : {}),
            },
          },
        },
      };
      const archives: Record<string, string> = {
        "https://thunderstore.io/package/download/Au/Top/1.0.0/": pack("top", ["Au-Mid-1.0.0", "bep-BepInExPack-5.4.0"]),
        "https://thunderstore.io/package/download/Au/Mid/1.0.0/": pack("mid", ["Au-Leaf-2.0.0", "Au-Top-1.0.0"]),
        "https://thunderstore.io/package/download/Au/Leaf/2.0.0/": pack("leaf", []),
        "https://thunderstore.io/package/download/bep/BepInExPack/5.4.0/": pack("bep", []),
      };
      const world = makeWorld(remote, {});
      world.io.download = async (url, dest) => {
        const body = archives[url];
        if (!body) throw new Error(`404 ${url}`);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, body);
      };
      const inspector = new InstanceInspector({ configs: [config], resolver: world.resolver, platform: "win32", rootPath: () => root });
      return { remote, installer: new InstanceInstaller({ inspector, resolver: world.resolver, platform: "win32", io: world.io }) };
    };

    it("sans `dependencies` : seule la liste est installée", async () => {
      const { installer } = setup();
      await installer.sync("g", "stable");
      assert.equal(fs.existsSync(path.join(dir("stable"), "game/plugins/Au-Top")), true);
      assert.equal(fs.existsSync(path.join(dir("stable"), "game/plugins/Au-Mid")), false);
    });

    it("avec `dependencies` : chaîne résolue, cycle et `skip` respectés", async () => {
      const { installer } = setup({ skip: ["bep-BepInExPack"] });
      const result = await installer.sync("g", "stable");
      assert.deepEqual(result.failed, []);
      for (const folder of ["Au-Top", "Au-Mid", "Au-Leaf"]) {
        assert.equal(fs.existsSync(path.join(dir("stable"), "game/plugins", folder)), true, folder);
      }
      assert.equal(fs.existsSync(path.join(dir("stable"), "game/plugins/bep-BepInExPack")), false);
    });

    it("dépendance non ignorée : installée aussi", async () => {
      const { installer } = setup({});
      await installer.sync("g", "stable");
      assert.equal(read("stable", "game/plugins/bep-BepInExPack/plugin.dll"), "bep");
    });
  });

  describe("installation atomique", () => {
    // v2 : data/a.txt change, bin/game.exe change mais n'est PAS téléchargeable (404) ; gameFolderToRemove: data
    const v2 = () => {
      const next = { "bin/game.exe": sha("exe-v2"), "data/a.txt": sha("a2") };
      const remote = baseRemote() as Record<string, any>;
      remote["/stable.yml"]["game-base"].base = {
        ...remote["/stable.yml"]["game-base"].base,
        version: "2.0.0",
        content: "/manifest2.json",
        hash: manifestHash(next, ["logs"]),
        gameFolderToRemove: ["data"],
      };
      remote["/manifest2.json"] = next;
      return remote;
    };

    it("un téléchargement qui échoue en cours de route ne touche pas à l'installation", async () => {
      const first = build(baseRemote(), files);
      await first.installer.sync("g", "stable");
      assert.equal(read("stable", "game/data/a.txt"), "a");

      // Les fichiers v2 : seul a.txt est disponible (game.exe → 404)
      const second = build(v2(), { ...files, "/h/data/a.txt": "a2" });
      const result = await second.installer.sync("g", "stable");

      assert.equal(result.failed.length, 1);
      assert.equal(read("stable", "game/bin/game.exe"), "exe-v1"); // inchangé
      assert.equal(read("stable", "game/data/a.txt"), "a"); // ni écrasé ni supprimé (gameFolderToRemove non appliqué)
    });

    it("tout disponible : bascule complète, gameFolderToRemove appliqué", async () => {
      const first = build(baseRemote(), files);
      await first.installer.sync("g", "stable");
      const second = build(v2(), { ...files, "/h/data/a.txt": "a2", "/h/bin/game.exe": "exe-v2" });
      const result = await second.installer.sync("g", "stable");

      assert.deepEqual(result.failed, []);
      assert.equal(read("stable", "game/bin/game.exe"), "exe-v2");
      assert.equal(read("stable", "game/data/a.txt"), "a2");
    });

    it("archive zip invalide : l'installation n'est pas modifiée", async () => {
      const first = build(baseRemote(), files);
      await first.installer.sync("g", "stable");
      const remote = baseRemote() as Record<string, any>;
      remote["/stable.yml"]["game-details"].extra = { version: "1", type: "zip_url", content: "/broken.zip" };
      const second = build(remote, { ...files, "/broken.zip": "pas du json" });
      const result = await second.installer.sync("g", "stable");
      assert.equal(result.failed.length, 1);
      assert.equal(read("stable", "game/data/a.txt"), "a");
    });
  });

  it("synchronisation réussie : le dossier .tmp est entièrement supprimé", async () => {
    const okRemote = baseRemote();
    const { installer } = build(okRemote, files);
    await installer.sync("g", "stable");
    assert.equal(fs.existsSync(path.join(dir("stable"), ".tmp")), false);
  });
});
