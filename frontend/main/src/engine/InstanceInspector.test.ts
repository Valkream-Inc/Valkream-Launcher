import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { createHash } from "node:crypto";

import type { InstanceMainConfig } from "../types/instances";
import { InstanceInspector } from "./InstanceInspector";
import { recordInstalledEntry, writeInstanceSetting } from "./install-store";
import { instanceRootPath } from "./paths";
import type { ParamResolver } from "./ParamResolver";

const sha = (text: string) => createHash("sha256").update(text).digest("hex");
const server = { type: "valheim", host: "h", port: 1, timeout: 1 };

const config: InstanceMainConfig = {
  id: "game-v2",
  server,
  indexUrl: "/index.json",
  allowedPaths: ["game"],
  executable: { win32: "game/run.exe" },
};

const remote: Record<string, unknown> = {
  "/index.json": {
    schemaVersion: 1,
    instances: [
      {
        id: "game-v2",
        enabled: { win32: true },
        channels: { stable: "/stable.yml", beta: "/beta.yml" },
        mods: [{ name: "Mod A" }],
        contributors: [{ name: "Alice" }],
      },
    ],
  },
  "/stable.yml": {
    version: "1.0.0.0",
    "game-base": {
      base: { version: "1.0.0", path: "game", type: "zip_url", content: "/b.zip" },
    },
    "game-breaking": {
      admin: {
        version: "1.0.0",
        path: "game",
        type: "zip_url",
        content: "/a.zip",
        optional: { setting: "modsAdmin" },
      },
    },
    "game-notbreaking": {
      cfg: {
        version: "2.0.0",
        path: "game/config",
        type: "zip_url",
        content: "/c.zip",
        gameFolderToPreserve: [{ path: "client.cfg", from: ">=1.0.0" }],
        to_ignore: ["*.log"],
      },
    },
  },
  "/beta.yml": {
    version: "1.1.0.0",
    "game-base": {
      base: { version: "1.1.0", path: "game", type: "zip_url", content: "/b.zip" },
    },
  },
};

const resolver = {
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

let root: string;
const inspector = () =>
  new InstanceInspector({ configs: [config], resolver, platform: "win32", rootPath: () => root });
const dir = (channel: "stable" | "beta") => instanceRootPath(root, "game-v2", channel);

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "inspector-"));
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

describe("InstanceInspector", () => {
  it("rien d'installé : tout est à installer, le jeu ne marche pas", async () => {
    const report = await inspector().report("game-v2", "stable");
    assert.deepEqual(report.errors, []);
    assert.deepEqual(
      report.entries.map((e) => [e.name, e.status]),
      [["base", "not-installed"], ["admin", "skipped"], ["cfg", "not-installed"]],
    );
    assert.deepEqual(report.summary.blocking, ["base"]);
    assert.equal(report.summary.works, false);
    assert.equal(report.mods[0].name, "Mod A");
    assert.equal(report.contributors[0].name, "Alice");
  });

  it("tout à jour : jouable ; une entrée non bloquante en retard n'empêche pas de jouer", async () => {
    recordInstalledEntry(dir("stable"), "base", { version: "1.0.0" });
    recordInstalledEntry(dir("stable"), "cfg", { version: "1.9.0" });
    const report = await inspector().report("game-v2", "stable");
    assert.equal(report.entries[2].status, "outdated");
    assert.equal(report.entries[2].blocking, false);
    assert.equal(report.summary.works, true);
    // config installée en 1.9.0 : la règle >=1.0.0 conserve client.cfg
    assert.deepEqual(report.entries[2].preserved, ["client.cfg"]);
    assert.deepEqual(report.entries[2].toIgnore, ["*.log"]);
  });

  it("entrée optionnelle : active selon le réglage de l'instance", async () => {
    writeInstanceSetting(dir("stable"), "modsAdmin", true);
    const report = await inspector().report("game-v2", "stable");
    assert.equal(report.entries[1].status, "not-installed");
    assert.deepEqual(report.summary.blocking, ["base", "admin"]);
  });

  it("beta : installation, état et réglages totalement séparés du stable", async () => {
    recordInstalledEntry(dir("stable"), "base", { version: "1.0.0" });
    writeInstanceSetting(dir("stable"), "modsAdmin", true);

    const beta = await inspector().report("game-v2", "beta");
    assert.notEqual(beta.installDir, dir("stable"));
    assert.equal(beta.releaseVersion, "1.1.0.0");
    assert.equal(beta.entries[0].status, "not-installed");
    assert.deepEqual(beta.settings, {});

    recordInstalledEntry(dir("beta"), "base", { version: "1.1.0" });
    const stable = await inspector().report("game-v2", "stable");
    assert.equal(stable.entries[0].status, "up-to-date");
    assert.equal(stable.entries[0].installedVersion, "1.0.0");
  });

  it("canal non proposé : erreur claire, pas d'exception", async () => {
    const other: Record<string, unknown> = { ...remote, "/index.json": { schemaVersion: 1, instances: [{ id: "game-v2", enabled: { win32: true } }] } };
    const noChannel = {
      getJson: async (p: unknown) => ({ value: typeof p === "string" ? other[p] : p, source: "online" }),
      getYaml: async (l: string) => ({ value: other[l], source: "online" }),
    } as unknown as ParamResolver;
    const report = await new InstanceInspector({
      configs: [config], resolver: noChannel, platform: "win32", rootPath: () => root,
    }).report("game-v2", "beta");
    assert.match(report.errors.join(), /canal « beta »/);
    assert.equal(report.summary.works, false);
  });

  it("entrée invalide : rattachée à son entrée, statut invalid", async () => {
    const broken = structuredClone(remote["/stable.yml"]) as Record<string, any>;
    broken["game-base"].base.path = "../dehors";
    const local = {
      getJson: resolver.getJson,
      getYaml: async () => ({ value: broken, source: "cache" }),
    } as unknown as ParamResolver;
    const report = await new InstanceInspector({
      configs: [config], resolver: local, platform: "win32", rootPath: () => root,
    }).report("game-v2", "stable");
    assert.equal(report.releaseSource, "cache");
    assert.equal(report.entries[0].status, "invalid");
    assert.match(report.entries[0].errors.join(), /path/);
    assert.equal(report.summary.invalid, 1);
  });

  it("vérification approfondie : fichier modifié → modified (to_ignore exclu)", async () => {
    const gameDir = path.join(dir("stable"), "game");
    fs.mkdirSync(path.join(gameDir, "logs"), { recursive: true });
    fs.writeFileSync(path.join(gameDir, "a.txt"), "local");
    fs.writeFileSync(path.join(gameDir, "logs", "x.log"), "autre");
    recordInstalledEntry(dir("stable"), "base", { version: "1.0.0" });

    const hashRemote = structuredClone(remote) as Record<string, any>;
    hashRemote["/stable.yml"]["game-base"].base = {
      version: "1.0.0", path: "game", type: "hash_url", "hash-folder": "/h/",
      content: { "a.txt": sha("remote"), "logs/x.log": sha("attendu") },
      to_ignore: ["logs"],
    };
    const r = {
      getJson: async (p: unknown) => (typeof p === "string" ? { value: hashRemote[p], source: "online" } : { value: p, source: "inline" }),
      getYaml: async (l: string) => ({ value: hashRemote[l], source: "online" }),
    } as unknown as ParamResolver;

    const report = await new InstanceInspector({
      configs: [config], resolver: r, platform: "win32", rootPath: () => root,
    }).report("game-v2", "stable", { verify: true });
    assert.equal(report.entries[0].status, "modified");
    assert.deepEqual(report.entries[0].files, { missing: [], changed: ["a.txt"] });
  });

  it("instance inconnue : lève", async () => {
    await assert.rejects(() => inspector().report("nope", "stable"), /inconnue/);
  });
});
