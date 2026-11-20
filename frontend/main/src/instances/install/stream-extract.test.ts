/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";

import { extractTar } from "../../lib/tar-extract";
import { streamExtractTarGz } from "./stream-extract";
const realInstallIO = { streamExtract: streamExtractTarGz };

/** Construit une archive tar minimale (ustar) en mémoire. */
const header = (name: string, size: number, type = "0"): Buffer => {
  const block = Buffer.alloc(512);
  block.write(name, 0, 100);
  block.write("0000644\0", 100);
  block.write(size.toString(8).padStart(11, "0") + "\0", 124);
  block.write(type, 156);
  block.write("ustar\0", 257);
  block.fill(0x20, 148, 156);
  const sum = block.reduce((total, byte) => total + byte, 0);
  block.write(sum.toString(8).padStart(6, "0") + "\0 ", 148);
  return block;
};
const entry = (name: string, content: string | Buffer, type = "0"): Buffer => {
  const data = Buffer.from(content);
  const pad = Buffer.alloc((512 - (data.length % 512)) % 512);
  return Buffer.concat([header(name, data.length, type), data, pad]);
};
const tar = (...entries: Buffer[]): Buffer => Buffer.concat([...entries, Buffer.alloc(1024)]);

const big = Buffer.alloc(300_000, "0123456789");
const archive = tar(
  entry("pack/", "", "5"),
  entry("pack/a.txt", "hello"),
  entry("pack/sub/b.bin", big),
  entry("pack/empty.txt", ""),
  entry("pack/link", "", "2"),
  entry("other/skip.txt", "x"),
  entry("pack/../../evil.txt", "evil"),
);
const gz = zlib.gzipSync(archive);

describe("extractTar", () => {
  it("lit les fichiers même découpés en petits morceaux", async () => {
    const chunks = (function* () {
      for (let i = 0; i < archive.length; i += 333) yield archive.subarray(i, i + 333);
    })();
    const seen: Record<string, Buffer[]> = {};
    const { files } = await extractTar(chunks as unknown as AsyncIterable<Buffer>, {
      onFile: ({ path: name }) => {
        const parts: Buffer[] = (seen[name] = []);
        const { Writable } = require("node:stream") as typeof import("node:stream");
        return new Writable({ write: (chunk, _e, done) => (parts.push(chunk), done()) });
      },
    });
    assert.equal(files, 5);
    assert.equal(Buffer.concat(seen["pack/a.txt"]).toString(), "hello");
    assert.ok(Buffer.concat(seen["pack/sub/b.bin"]).equals(big));
  });

  it("archive tronquée : erreur", async () => {
    const { Writable } = await import("node:stream");
    await assert.rejects(
      extractTar([archive.subarray(0, 700)] as unknown as AsyncIterable<Buffer>, {
        onFile: () => new Writable({ write: (_c, _e, done) => done() }),
      }),
      /tronquée/,
    );
  });

  it("limite de fichiers", async () => {
    const { Writable } = await import("node:stream");
    await assert.rejects(
      extractTar([archive] as unknown as AsyncIterable<Buffer>, { onFile: () => new Writable({ write: (_c, _e, d) => d() }) }, { maxFiles: 2, maxBytes: 1e12 }),
      /fichiers/,
    );
  });
});

describe("realInstallIO.streamExtract", () => {
  let server: http.Server;
  let base: string;
  let dir: string;
  let failures = 0;
  before(async () => {
    server = http.createServer((_req, res) => {
      if (failures > 0) {
        failures--;
        res.writeHead(200, { "Content-Length": gz.length });
        res.write(gz.subarray(0, 100));
        return void setTimeout(() => res.socket?.destroy(), 20);
      }
      res.writeHead(200, { "Content-Length": gz.length });
      res.end(gz);
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  after(() => {
    server.closeAllConnections();
    server.close();
  });
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "stream-"));
    failures = 0;
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it("extrait en flux : dossier cible, accept, zip slip, progression", async () => {
    const out = path.join(dir, "out");
    let percent = 0;
    await realInstallIO.streamExtract(
      `${base}/pack.tar.gz`,
      out,
      { folderInZip: "pack", accept: (relative) => relative !== "empty.txt" },
      undefined,
      (progress) => void (percent = progress.percent),
    );
    assert.equal(fs.readFileSync(path.join(out, "a.txt"), "utf8"), "hello");
    assert.ok(fs.readFileSync(path.join(out, "sub", "b.bin")).equals(big));
    assert.ok(!fs.existsSync(path.join(out, "empty.txt")));
    assert.ok(!fs.existsSync(path.join(dir, "evil.txt")));
    assert.ok(!fs.existsSync(path.join(out, "skip.txt")));
    assert.equal(percent, 100);
  });

  it("coupure réseau : recommence proprement", async () => {
    failures = 1;
    const out = path.join(dir, "out2");
    await realInstallIO.streamExtract(`${base}/pack.tar.gz`, out, { folderInZip: "pack", accept: () => true });
    assert.equal(fs.readFileSync(path.join(out, "a.txt"), "utf8"), "hello");
  });
});
