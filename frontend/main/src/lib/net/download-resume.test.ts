/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { completePartial, discardPartial, rememberPartial, resumePoint, validatorOf } from "./download-resume.js";

let dir: string;
let dest: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "resume-"));
  dest = path.join(dir, "file.part");
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("resumePoint", () => {
  it("rien sur le disque : on repart de zéro", () => {
    assert.deepEqual(resumePoint(dest, "https://x/a"), { offset: 0 });
  });

  it("même URL + validateur : reprise à la taille du fichier partiel", () => {
    fs.writeFileSync(dest, "12345");
    rememberPartial(dest, "https://x/a", '"etag-1"');
    assert.deepEqual(resumePoint(dest, "https://x/a"), { offset: 5, validator: '"etag-1"' });
    assert.equal(fs.existsSync(dest), true);
  });

  it("autre URL : le partiel est supprimé", () => {
    fs.writeFileSync(dest, "12345");
    rememberPartial(dest, "https://x/a", '"etag-1"');
    assert.deepEqual(resumePoint(dest, "https://x/b"), { offset: 0 });
    assert.equal(fs.existsSync(dest), false);
    assert.equal(fs.existsSync(`${dest}.meta`), false);
  });

  it("partiel sans métadonnées (ancienne exécution) : supprimé", () => {
    fs.writeFileSync(dest, "12345");
    assert.deepEqual(resumePoint(dest, "https://x/a"), { offset: 0 });
    assert.equal(fs.existsSync(dest), false);
  });

  it("sans validateur : reprise permise seulement dans la même exécution", () => {
    fs.writeFileSync(dest, "123");
    rememberPartial(dest, "https://x/a"); // même exécution
    assert.deepEqual(resumePoint(dest, "https://x/a"), { offset: 3, validator: undefined });

    // simulation d'une nouvelle exécution : le fichier est « inconnu » de la mémoire
    completePartial(dest);
    fs.writeFileSync(`${dest}.meta`, JSON.stringify({ url: "https://x/a" }));
    assert.deepEqual(resumePoint(dest, "https://x/a"), { offset: 0 });
  });

  it("completePartial et discardPartial retirent les métadonnées", () => {
    fs.writeFileSync(dest, "1");
    rememberPartial(dest, "https://x/a", "v");
    completePartial(dest);
    assert.equal(fs.existsSync(`${dest}.meta`), false);
    assert.equal(fs.existsSync(dest), true);
    discardPartial(dest);
    assert.equal(fs.existsSync(dest), false);
  });
});

describe("validatorOf", () => {
  it("préfère l'ETag fort, ignore l'ETag faible, retombe sur Last-Modified", () => {
    assert.equal(validatorOf({ etag: '"abc"', "last-modified": "d" }), '"abc"');
    assert.equal(validatorOf({ etag: 'W/"abc"', "last-modified": "Mon, 01 Jan 2026" }), "Mon, 01 Jan 2026");
    assert.equal(validatorOf({}), undefined);
  });
});
