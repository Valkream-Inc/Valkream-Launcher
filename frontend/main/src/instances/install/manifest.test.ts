import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { createHash } from "node:crypto";

import { hashFile, manifestHash, scanManifest, verifyManifest } from "./manifest.js";

const sha = (text: string) => createHash("sha256").update(text).digest("hex");

describe("manifestHash", () => {
  const manifest = { "a.txt": sha("a"), "b/c.txt": sha("c") };

  it("ne dépend pas de l'ordre des clés", () => {
    assert.equal(
      manifestHash(manifest),
      manifestHash({ "b/c.txt": sha("c"), "a.txt": sha("a") }),
    );
  });

  it("change si un fichier change", () => {
    assert.notEqual(manifestHash(manifest), manifestHash({ ...manifest, "a.txt": sha("x") }));
  });

  it("to_ignore : un fichier ignoré n'influence pas le hash", () => {
    const withLog = { ...manifest, "logs/run.log": sha("v1") };
    const withOtherLog = { ...manifest, "logs/run.log": sha("v2") };
    assert.equal(manifestHash(withLog, ["logs"]), manifestHash(withOtherLog, ["logs"]));
    assert.equal(manifestHash(withLog, ["logs"]), manifestHash(manifest));
    assert.notEqual(manifestHash(withLog), manifestHash(withOtherLog));
  });
});

describe("verifyManifest", () => {
  it("signale manquants et modifiés, ignore to_ignore et les fichiers en plus", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-"));
    try {
      fs.writeFileSync(path.join(dir, "ok.txt"), "ok");
      fs.writeFileSync(path.join(dir, "edited.txt"), "local");
      fs.writeFileSync(path.join(dir, "extra.txt"), "joueur");
      fs.mkdirSync(path.join(dir, "logs"));
      fs.writeFileSync(path.join(dir, "logs", "a.log"), "différent");

      const diff = await verifyManifest(
        dir,
        {
          "ok.txt": sha("ok"),
          "edited.txt": sha("remote"),
          "gone.txt": sha("g"),
          "logs/a.log": sha("attendu"),
        },
        ["logs"],
      );
      assert.deepEqual(diff, { missing: ["gone.txt"], changed: ["edited.txt"] });
      assert.equal(await hashFile(path.join(dir, "ok.txt")), sha("ok"));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("scanManifest", () => {
  it("produit un manifeste cohérent avec manifestHash et verifyManifest", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scan-"));
    try {
      fs.mkdirSync(path.join(dir, "bin"));
      fs.writeFileSync(path.join(dir, "bin", "game.exe"), "exe");
      fs.writeFileSync(path.join(dir, "a.txt"), "a");
      fs.mkdirSync(path.join(dir, "logs"));
      fs.writeFileSync(path.join(dir, "logs", "x.log"), "log");

      const manifest = await scanManifest(dir, ["logs"]);
      assert.deepEqual(manifest, { "a.txt": sha("a"), "bin/game.exe": sha("exe") });
      assert.deepEqual(await verifyManifest(dir, manifest, ["logs"]), { missing: [], changed: [] });
      assert.equal(manifestHash(manifest), manifestHash({ ...manifest, "logs/x.log": sha("log") }, ["logs"]));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
