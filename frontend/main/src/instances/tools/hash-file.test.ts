import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { manifestHash } from "../install/state/manifest.js";
import { hashAnyFile, readManifest } from "./hash-file.js";

const manifest = { "b/x.txt": "AA".repeat(32), "a.txt": "bb".repeat(32) };

describe("hashAnyFile", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hash-file-"));
  const write = (name: string, content: string) => {
    const file = path.join(dir, name);
    fs.writeFileSync(file, content);
    return file;
  };

  it("manifeste : même hash quelle que soit l'indentation, les sauts de ligne ou le BOM", async () => {
    const expected = manifestHash(manifest);
    const variants = [
      JSON.stringify(manifest),
      JSON.stringify(manifest, null, 2),
      JSON.stringify(manifest, null, "\t"),
      JSON.stringify(manifest, null, 4).replace(/\n/g, "\r\n"),
      "﻿" + JSON.stringify(manifest, null, 2),
    ];
    for (const [index, text] of variants.entries()) {
      const result = await hashAnyFile(write(`m${index}.json`, text));
      assert.equal(result.kind, "manifest");
      assert.equal(result.hash, expected);
      assert.equal(result.fileCount, 2);
    }
  });

  it("manifeste : les motifs to_ignore sont pris en compte", async () => {
    const result = await hashAnyFile(write("ign.json", JSON.stringify(manifest)), ["a.txt"]);
    assert.equal(result.hash, manifestHash(manifest, ["a.txt"]));
  });

  it("fichier quelconque (ou JSON qui n'est pas un manifeste) : sha256 des octets", async () => {
    const zip = write("pack.zip", "contenu");
    assert.deepEqual(await hashAnyFile(zip), {
      file: zip,
      kind: "file",
      hash: createHash("sha256").update("contenu").digest("hex"),
      size: 7,
    });
    assert.equal((await hashAnyFile(write("other.json", '{"a": 1}'))).kind, "file");
    assert.equal(readManifest("pas du json"), null);
  });
});
