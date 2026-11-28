/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { classifyDepotFailure } from "./depot-output.js";
import { buildDepotArgs, downloadWithDepot } from "./depot-download.js";
import { parseDepotPercent, type DepotRunner } from "./depot-runner.js";
import { depotAssetFor, ensureDepotDownloader } from "./depot-tool.js";

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "depot-"));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const sha = (text: string) => createHash("sha256").update(text).digest("hex");

describe("arguments DepotDownloader", () => {
  it("tableau d'arguments : app, depot, manifeste, os, dossier forcé, QR, aucun mot de passe", () => {
    const args = buildDepotArgs(892970, { id: 892971, manifest: "1234567890123456789" }, "/out", "windows");
    assert.deepEqual(args, [
      "-app", "892970", "-depot", "892971", "-manifest", "1234567890123456789",
      "-os", "windows", "-dir", "/out", "-qr", "-max-downloads", "8",
    ]);
    assert.ok(!args.includes("-password"));
    assert.ok(!args.includes("-username"));
  });

  it("refuse les valeurs non numériques (pas d'injection d'option)", () => {
    assert.throws(() => buildDepotArgs(1, { id: "1 -password x", manifest: "1" }, "/o", "linux"), /depot/);
    assert.throws(() => buildDepotArgs(1, { id: 1, manifest: "-dir" }, "/o", "linux"), /manifeste/);
    assert.throws(() => buildDepotArgs(-1, { id: 1, manifest: "1" }, "/o", "linux"), /appId/);
  });
});

describe("progression", () => {
  it("lit le pourcentage des lignes de DepotDownloader", () => {
    assert.equal(parseDepotPercent(" 42.50% depot/file.dat"), 42.5);
    assert.equal(parseDepotPercent("100.00% x"), 100);
    assert.equal(parseDepotPercent("Got 12 files"), undefined);
  });
});

describe("téléchargement", () => {
  const input = (runner: DepotRunner, extra = {}) => ({
    tool: "tool", runner, appId: 7, depot: { id: 8, manifest: "9" }, installDir: dir, os: "linux" as const, ...extra,
  });

  it("lance le runner, relaie les lignes et le pourcentage, retourne le dossier", async () => {
    const lines: string[] = [];
    const percents: number[] = [];
    const runner: DepotRunner = async (_cmd, _args, { onLine, cwd }) => {
      assert.ok(cwd.startsWith(dir));
      onLine("██ QR ██");
      onLine(" 50.00% a.dat");
      return 0;
    };
    const out = await downloadWithDepot(input(runner, { onLine: (l: string) => lines.push(l), onPercent: (p: number) => percents.push(p) }));
    assert.ok(out.startsWith(path.join(dir, ".depot")));
    assert.deepEqual(lines, ["██ QR ██", " 50.00% a.dat"]);
    assert.deepEqual(percents, [50]);
  });

  it("code de sortie non nul : erreur", async () => {
    await assert.rejects(() => downloadWithDepot(input(async () => 1)), /code 1/);
  });
});

describe("étapes et erreurs lisibles", () => {
  const input = (runner: DepotRunner, extra = {}) => ({
    tool: "tool", runner, appId: 7, depot: { id: 8, manifest: "9" }, installDir: dir, os: "linux" as const, ...extra,
  });
  const failing = (lines: string[], code = 1): DepotRunner => async (_c, _a, { onLine }) => {
    lines.forEach(onLine);
    return code;
  };

  it("détecte les étapes : connexion, téléchargement, fin (une seule fois chacune)", async () => {
    const steps: string[] = [];
    const runner = failing(["Logging into Steam3 using QR", "██ ██", " 10.00% a", " 20.00% b", "Total downloaded: 1 GB"], 0);
    await downloadWithDepot(input(runner, { onStep: (step: string) => steps.push(step) }));
    assert.deepEqual(steps, ["login", "download", "finish"]);
  });

  it("classe la cause d'un échec (connexion, licence, limite, disque, réseau, QR expiré)", () => {
    const key = (...lines: string[]) => classifyDepotFailure(lines).key;
    assert.equal(key("Unable to login to Steam3: InvalidPassword"), "err.depotLogin");
    assert.equal(key("Logging in", "Depot 8 is not available for this account"), "err.depotNotOwned");
    assert.equal(key("Failed to get depot key"), "err.depotNotOwned");
    assert.equal(key("Login failed: RateLimitExceeded"), "err.depotRateLimit");
    assert.equal(key("Error: No space left on device"), "err.depotNoSpace");
    assert.equal(key("SocketException: Connection reset by peer"), "err.depotNetwork");
    assert.equal(key("QR code challenge expired"), "err.depotQrTimeout");
    assert.equal(key("quelque chose d'inconnu"), "err.depotFailed");
  });

  it("le détail est la dernière ligne utile (ni pourcentage, ni QR)", () => {
    const failure = classifyDepotFailure(["Erreur grave XYZ", " 50.00% a.dat", "██▀▀██"]);
    assert.equal(failure.detail, "Erreur grave XYZ");
    assert.equal(classifyDepotFailure([]).detail, "—");
  });

  it("l'échec lève l'erreur précise, traduite, avec le détail", async () => {
    await assert.rejects(() => downloadWithDepot(input(failing(["Unable to login to Steam3: AccountLoginDeniedThrottle"]))), /limite temporairement/);
    await assert.rejects(() => downloadWithDepot(input(failing(["x", "InvalidPassword"]))), /Connexion à Steam refusée.*InvalidPassword/);
    await assert.rejects(() => downloadWithDepot(input(failing(["boum"]))), /code 1.*boum/);
  });

  it("outil impossible à démarrer : erreur dédiée ; annulation : « annulé », pas d'erreur système", async () => {
    const spawnFail: DepotRunner = async () => {
      throw Object.assign(new Error("spawn EACCES"), { code: "EACCES" });
    };
    await assert.rejects(() => downloadWithDepot(input(spawnFail)), /Impossible de démarrer DepotDownloader \(EACCES\)/);

    const controller = new AbortController();
    const aborted: DepotRunner = async () => {
      controller.abort();
      throw new Error("The operation was aborted");
    };
    await assert.rejects(() => downloadWithDepot(input(aborted, { signal: controller.signal })), /annulé/);
  });
});

describe("outil épinglé", () => {
  const zip = "ZIP-CONTENT";
  const fakeIo = (content: string) => ({
    download: async (_url: string, dest: string) => fs.writeFileSync(dest, content),
    extract: async (_zip: string, out: string) => {
      fs.mkdirSync(out, { recursive: true });
      fs.writeFileSync(path.join(out, "DepotDownloader"), "EXE");
    },
  });
  const assets = { "linux-x64": { url: "https://x.test/dd.zip", sha256: sha(zip), file: "DepotDownloader" } };

  it("asset absent, sans https ou au hash invalide : non configuré", () => {
    assert.equal(depotAssetFor({}, "linux-x64"), undefined);
    assert.equal(depotAssetFor({ "linux-x64": { url: "http://x", sha256: sha(zip), file: "a" } }, "linux-x64"), undefined);
    assert.equal(depotAssetFor({ "linux-x64": { url: "https://x", sha256: "abc", file: "a" } }, "linux-x64"), undefined);
    assert.equal(depotAssetFor({ "linux-x64": { url: "https://x", sha256: sha(zip), file: "../a" } }, "linux-x64"), undefined);
    assert.ok(depotAssetFor(assets, "linux-x64"));
  });

  it("hash conforme : extrait et retourne l'exécutable", async () => {
    const exe = await ensureDepotDownloader({ toolsDir: dir, platformKey: "linux-x64", assets, io: fakeIo(zip) });
    assert.equal(fs.readFileSync(exe, "utf8"), "EXE");
  });

  it("hash différent : exécution refusée, rien n'est extrait", async () => {
    await assert.rejects(
      () => ensureDepotDownloader({ toolsDir: dir, platformKey: "linux-x64", assets, io: fakeIo("TAMPERED") }),
      /hash.*refusée/,
    );
    assert.deepEqual(fs.readdirSync(path.join(dir, "depotdownloader")), []);
  });

  it("nouvelle version épinglée : téléchargée, ancienne supprimée", async () => {
    const first = await ensureDepotDownloader({ toolsDir: dir, platformKey: "linux-x64", assets, io: fakeIo(zip) });
    const newer = { "linux-x64": { url: "https://x.test/dd2.zip", sha256: sha("ZIP2"), file: "DepotDownloader" } };
    const second = await ensureDepotDownloader({ toolsDir: dir, platformKey: "linux-x64", assets: newer, io: fakeIo("ZIP2") });
    assert.notEqual(first, second);
    assert.ok(!fs.existsSync(first), "l'ancienne version est supprimée");
    assert.ok(fs.existsSync(second));
  });

  it("exécutable modifié après coup : retéléchargé et revérifié", async () => {
    const exe = await ensureDepotDownloader({ toolsDir: dir, platformKey: "linux-x64", assets, io: fakeIo(zip) });
    fs.writeFileSync(exe, "EVIL");
    const again = await ensureDepotDownloader({ toolsDir: dir, platformKey: "linux-x64", assets, io: fakeIo(zip) });
    assert.equal(fs.readFileSync(again, "utf8"), "EXE");
  });
});

import { platformOfAsset, renderDepotConfig } from "./depot-pins.js";

describe("épinglage d'une release", () => {
  it("reconnaît les assets par plateforme, ignore le reste", () => {
    assert.deepEqual(platformOfAsset("DepotDownloader-windows-x64.zip"), { key: "win32-x64", file: "DepotDownloader.exe" });
    assert.deepEqual(platformOfAsset("DepotDownloader-macos-arm64.zip"), { key: "darwin-arm64", file: "DepotDownloader" });
    assert.equal(platformOfAsset("source.tar.gz"), undefined);
  });

  it("le fichier généré contient version et hash fournis", () => {
    const text = renderDepotConfig("v1", { "linux-x64": { url: "https://x/y.zip", sha256: "a".repeat(64), file: "DepotDownloader" } });
    assert.match(text, /DEPOT_DOWNLOADER_VERSION = "v1"/);
    assert.match(text, /"linux-x64": \{"url":"https:\/\/x\/y\.zip","sha256":"a{64}"/);
  });
});

describe("realDepotRunner : décodage", () => {
  // Windows : DepotDownloader écrit en OEM (CP437, 1 octet par bloc) ; ailleurs : UTF-8 (3 octets par bloc)
  it("ne corrompt pas un caractère coupé entre deux morceaux", async () => {
    const { realDepotRunner } = await import("./depot-runner.js");
    const bytes = process.platform === "win32" ? "[0xdb,0xdf,0xdc,10]" : 'Buffer.from("\\u2588\\u2580\\u2584\\n","utf8")';
    const script = `const b=Buffer.from(${bytes});process.stdout.write(b.subarray(0,2));setTimeout(()=>process.stdout.write(b.subarray(2)),50)`;
    const lines: string[] = [];
    const code = await realDepotRunner(process.execPath, ["-e", script], { cwd: process.cwd(), onLine: (l) => lines.push(l) });
    assert.equal(code, 0);
    assert.deepEqual(lines, ["█▀▄"]);
  });
});
