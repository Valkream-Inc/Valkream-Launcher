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
import { after, afterEach, before, beforeEach, describe, it } from "node:test";

import { downloadFile } from "./download-file";

const content = Buffer.alloc(200_000, "abcdefghij");
let body = content;
let etag = '"v1"';
let hits: { range?: string }[] = [];
let mode: "ok" | "cut-once" | "stall-once" | "404" = "ok";
let interrupted = false;
let server: http.Server;
let base: string;
let dir: string;

before(async () => {
  server = http.createServer((req, res) => {
    hits.push({ range: req.headers.range });
    if (mode === "404") return void res.writeHead(404).end();

    let start = 0;
    const range = req.headers.range?.match(/bytes=(\d+)-/);
    const ifRange = req.headers["if-range"];
    if (range && (!ifRange || ifRange === etag)) start = parseInt(range[1], 10);
    const slice = body.subarray(start);
    res.writeHead(start ? 206 : 200, {
      "Content-Length": slice.length,
      ETag: etag,
      ...(start ? { "Content-Range": `bytes ${start}-${body.length - 1}/${body.length}` } : {}),
    });

    if (mode !== "ok" && !interrupted) {
      interrupted = true;
      res.write(slice.subarray(0, 50_000));
      if (mode === "cut-once") return void setTimeout(() => req.socket.destroy(), 30);
      return; // stall-once : plus rien n'est envoyé
    }
    res.end(slice);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => {
  server.closeAllConnections();
  server.close();
});
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "dl-"));
  body = content;
  etag = '"v1"';
  hits = [];
  mode = "ok";
  interrupted = false;
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const fast = { stallTimeoutMs: 300, retryDelayMs: 10 };
const noop = () => {};

describe("downloadFile (fetch)", () => {
  it("télécharge un fichier complet et notifie la progression", async () => {
    const dest = path.join(dir, "a.bin");
    let last = 0;
    await downloadFile(`${base}/a`, dest, (_d, _t, percent) => void (last = percent), undefined, fast);
    assert.ok(fs.readFileSync(dest).equals(content));
    assert.equal(last, 100);
  });

  it("coupure réseau : reprise via Range, fichier identique", async () => {
    mode = "cut-once";
    const dest = path.join(dir, "b.bin");
    await downloadFile(`${base}/b`, dest, noop, undefined, fast);
    assert.ok(fs.readFileSync(dest).equals(content));
    assert.ok(hits.some((h) => h.range?.startsWith("bytes=")), "une reprise Range est attendue");
  });

  it("flux bloqué : coupé par le watchdog puis repris", async () => {
    mode = "stall-once";
    const dest = path.join(dir, "c.bin");
    await downloadFile(`${base}/c`, dest, noop, undefined, fast);
    assert.ok(fs.readFileSync(dest).equals(content));
    assert.ok(hits.length >= 2);
  });

  it("fichier distant modifié pendant la reprise : on repart de zéro", async () => {
    mode = "cut-once";
    const dest = path.join(dir, "d.bin");
    const first = downloadFile(`${base}/d`, dest, noop, undefined, { stallTimeoutMs: 300, retryDelayMs: 150 });
    await new Promise((r) => setTimeout(r, 60));
    body = Buffer.alloc(120_000, "z");
    etag = '"v2"';
    await first;
    assert.ok(fs.readFileSync(dest).equals(body));
  });

  it("404 : échec immédiat sans réessayer", async () => {
    mode = "404";
    await assert.rejects(downloadFile(`${base}/x`, path.join(dir, "e.bin"), noop, undefined, fast), /404/);
    assert.equal(hits.length, 1);
  });

  it("annulation : rejette et ne boucle pas", async () => {
    mode = "stall-once";
    const controller = new AbortController();
    const p = downloadFile(`${base}/f`, path.join(dir, "f.bin"), noop, controller.signal, { stallTimeoutMs: 5000, retryDelayMs: 10 });
    setTimeout(() => controller.abort(), 100);
    await assert.rejects(p);
  });
});
