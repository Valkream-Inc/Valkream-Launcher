/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { checkBehavior, checkElectron, checkImports, checkSyntax } from "./check-runtime.js";

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "runtime-"));
  fs.writeFileSync(path.join(dir, "package.json"), '{"type":"module"}');
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const write = (file: string, content: string) => {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), content);
};

const goodBuild = () => {
  write(
    "src/lib/errors/messages.js",
    `const M = { fr: "dossier {{target}} non vide", en: "folder {{target}} not empty" };
     export const translate = (lang, key, vars = {}) => M[lang].replace("{{target}}", vars.target);`,
  );
  write("src/lib/fs/paths.js", `import path from "node:path";
     export const isPathInside = (parent, child) => { const r = path.relative(parent, child); return r !== "" && !r.startsWith("..") && !path.isAbsolute(r); };`);
  write("src/windows/mainWindow.js", `import { BrowserWindow, app } from "electron"; export const open = () => new BrowserWindow({ x: app.getName() });`);
  write("src/ipc/updater.js", `import electronUpdater from "electron-updater"; export const u = electronUpdater.autoUpdater;`);
  write("src/windows/mainPreload.cjs", `const { contextBridge } = require("electron"); module.exports = contextBridge;`);
  write("app.js", `import { app } from "electron"; app.whenReady();`);
};

describe("le build s'exécute", () => {
  it("un build correct passe les 3 vérifications (Electron simulé)", () => {
    goodBuild();
    assert.deepEqual(checkSyntax(dir), []);
    assert.deepEqual(checkImports(dir), []);
    assert.deepEqual(checkBehavior(dir), []);
  });

  it("syntaxe invalide (obfuscation cassée) détectée", () => {
    goodBuild();
    write("src/lib/broken.js", "export const a = (;");
    const problems = checkSyntax(dir);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /broken\.js/);
  });

  it("import cassé (dépendance absente, chemin déplacé) détecté", () => {
    goodBuild();
    write("src/lib/needs-missing.js", `import "./does-not-exist.js";`);
    write("src/lib/needs-package.js", `import "un-paquet-qui-n-existe-pas";`);
    const problems = checkImports(dir).join("\n");
    assert.match(problems, /needs-missing\.js/);
    assert.match(problems, /needs-package\.js/);
  });

  it("comportement faux ou module absent détecté", () => {
    goodBuild();
    write("src/lib/errors/messages.js", `export const translate = () => "";`);
    assert.match(checkBehavior(dir).join("\n"), /traduction fr/);
    fs.rmSync(path.join(dir, "src/lib/fs/paths.js"));
    assert.match(checkBehavior(dir).join("\n"), /paths/);
  });

  it("test Electron : ignoré avec une raison quand le binaire est absent", () => {
    const previous = process.cwd();
    process.chdir(dir);
    try {
      const result = checkElectron("build");
      assert.deepEqual(result.problems, []);
      assert.ok(result.skipped);
    } finally {
      process.chdir(previous);
    }
  });

  // Vrai build du main (tsc) : détecte un chemin d'import cassé après un déplacement de fichiers.
  // Nécessite `yarn install` (typescript + dépendances) ; ignoré sinon.
  const ready = fs.existsSync("node_modules/typescript") && fs.existsSync("node_modules/yaml");
  it("le main compilé par tsc se charge dans Node", { skip: !ready && "yarn install requis" }, () => {
    const out = path.join(dir, "compiled");
    const tsc = spawnSync(process.execPath, [path.resolve("node_modules/typescript/bin/tsc"), "-p", "main/tsconfig.json", "--outDir", out, "--sourceMap", "false"], { encoding: "utf8" });
    assert.equal(tsc.status, 0, tsc.stdout);
    fs.writeFileSync(path.join(dir, "package.json"), '{"type":"module"}');
    assert.deepEqual(checkImports(out), []);
    assert.deepEqual(checkBehavior(out), []);
  });
});
