/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * `yarn test` : vérifie la vérification (faux dist) ; si un vrai build existe (`dist/` + `build/`), il est
 * aussi contrôlé : un build dont latest.yml ne correspond pas aux fichiers casserait la mise à jour de tous les joueurs.
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { checkBuild, isNewerVersion } from "./check-build";

const NAME = "Valkream-Launcher";
let root: string;
let dist: string;
let app: string;

const write = (file: string, content: string) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};

/** Un faux build cohérent : installeurs, blockmap, latest.yml et application embarquée. */
const makeBuild = (version = "2.5.0") => {
  const update = `${NAME}-update-win-x64.exe`;
  write(path.join(dist, update), "contenu de la mise à jour");
  write(path.join(dist, `${update}.blockmap`), "blockmap");
  write(path.join(dist, `${NAME}-install-win-x64.exe`), "contenu de l'installeur");
  const content = fs.readFileSync(path.join(dist, update));
  const sha512 = createHash("sha512").update(content).digest("base64");
  write(
    path.join(dist, "latest.yml"),
    `version: ${version}\nfiles:\n  - url: ${update}\n    sha512: ${sha512}\n    size: ${content.length}\npath: ${update}\nsha512: ${sha512}\nreleaseDate: '2026-11-23T10:00:00.000Z'\n`,
  );
  for (const file of ["app.js", "frontend/index.html", "src/windows/updatePreload.cjs", "src/windows/mainPreload.cjs"]) write(path.join(app, file), "x");
};

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "check-build-"));
  dist = path.join(root, "dist");
  app = path.join(root, "build");
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

const run = (extra: Partial<Parameters<typeof checkBuild>[0]> = {}) =>
  checkBuild({ distDir: dist, appDir: app, name: NAME, version: "2.5.0", ...extra });

describe("checkBuild", () => {
  it("build cohérent : aucun problème (et mise à jour proposée depuis la version précédente)", () => {
    makeBuild();
    assert.deepEqual(run(), []);
    assert.deepEqual(run({ previous: "2.4.5" }), []);
  });

  it("version non supérieure à celle installée : aucune mise à jour ne serait proposée", () => {
    makeBuild();
    assert.match(run({ previous: "2.5.0" }).join(), /non supérieure/);
    assert.match(run({ previous: "3.0.0" }).join(), /non supérieure/);
  });

  it("latest.yml absent ou version différente de package.json", () => {
    assert.match(run().join(), /latest\.yml introuvable/);
    makeBuild("2.4.9");
    assert.match(run().join(), /version 2\.4\.9 ≠ package\.json 2\.5\.0/);
  });

  it("fichier modifié après la génération (sha512 / taille) : détecté", () => {
    makeBuild();
    write(path.join(dist, `${NAME}-update-win-x64.exe`), "autre contenu !");
    const problems = run().join("\n");
    assert.match(problems, /taille/);
    assert.match(problems, /sha512/);
  });

  it("blockmap, installeur de mise à jour ou d'installation manquants", () => {
    makeBuild();
    fs.rmSync(path.join(dist, `${NAME}-update-win-x64.exe.blockmap`));
    fs.rmSync(path.join(dist, `${NAME}-install-win-x64.exe`));
    const problems = run().join("\n");
    assert.match(problems, /blockmap manquant/);
    assert.match(problems, /installeur « install » absent/);
  });

  it("latest.yml qui vise l'installeur complet au lieu de la mise à jour", () => {
    makeBuild();
    const file = path.join(dist, "latest.yml");
    fs.writeFileSync(file, fs.readFileSync(file, "utf8").replaceAll("-update-", "-install-"));
    assert.match(run().join(), /n'est pas l'installeur de mise à jour/);
  });

  it("application embarquée incomplète (preload de la fenêtre de mise à jour)", () => {
    makeBuild();
    fs.rmSync(path.join(app, "src/windows/updatePreload.cjs"));
    assert.match(run().join(), /updatePreload\.cjs/);
  });
});

describe("isNewerVersion", () => {
  it("compare majeure, mineure et correctif", () => {
    assert.equal(isNewerVersion("2.5.0", "2.4.9"), true);
    assert.equal(isNewerVersion("3.0.0", "2.99.99"), true);
    assert.equal(isNewerVersion("2.4.5", "2.4.5"), false);
    assert.equal(isNewerVersion("2.4.4", "2.4.5"), false);
    assert.equal(isNewerVersion("n/a", "2.4.5"), false);
  });

  it("gère les pré-versions SemVer", () => {
    assert.equal(isNewerVersion("3.0.0-beta.2", "3.0.0-beta.1"), true);
    assert.equal(isNewerVersion("3.0.0-beta.1", "3.0.0-beta.1"), false);
    assert.equal(isNewerVersion("3.0.0-beta.10", "3.0.0-beta.9"), true);
    assert.equal(isNewerVersion("3.0.0", "3.0.0-beta.9"), true);
    assert.equal(isNewerVersion("3.0.0-beta.1", "3.0.0"), false);
    assert.equal(isNewerVersion("3.0.0-beta.1", "2.4.5"), true);
  });
});

describe("build réel (si présent)", () => {
  const frontend = path.resolve(import.meta.dirname, "..");
  const real = fs.existsSync(path.join(frontend, "dist", "latest.yml"));
  it("dist/ et build/ cohérents avec package.json", { skip: real ? false : "pas de build local (yarn build)" }, () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(frontend, "package.json"), "utf8")) as { name: string; version: string };
    assert.deepEqual(
      checkBuild({ distDir: path.join(frontend, "dist"), appDir: path.join(frontend, "build"), name: pkg.name, version: pkg.version }),
      [],
    );
  });
});
