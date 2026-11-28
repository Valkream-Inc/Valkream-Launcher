/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { GAMES_MARKER, syncUninstallPaths, UNINSTALL_PATHS_FILE } from "./uninstall-paths.js";

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "uninstall-"));
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

describe("liste des dossiers à supprimer à la désinstallation complète", () => {
  const defaultRoot = () => path.join(dir, "default");
  const file = () => path.join(defaultRoot(), UNINSTALL_PATHS_FILE);

  it("dossier personnalisé : listé (CRLF) avec son fichier repère", () => {
    const custom = path.join(dir, "D-jeux");
    const dirs = syncUninstallPaths({ file: file(), gamesRoot: custom, defaultRoot: defaultRoot() });
    assert.deepEqual(dirs, [path.join(custom, "instances")]);
    assert.equal(fs.readFileSync(file(), "utf8"), `${path.join(custom, "instances")}\r\n`);
    assert.ok(fs.existsSync(path.join(custom, "instances", GAMES_MARKER)));
  });

  it("retour au dossier par défaut : liste supprimée (le dossier de données part en entier)", () => {
    syncUninstallPaths({ file: file(), gamesRoot: path.join(dir, "D-jeux"), defaultRoot: defaultRoot() });
    assert.deepEqual(syncUninstallPaths({ file: file(), gamesRoot: defaultRoot(), defaultRoot: defaultRoot() }), []);
    assert.equal(fs.existsSync(file()), false);
  });

  it("le script NSIS lit ce même fichier et ce même repère, ignore les mises à jour et vérifie avant de supprimer", () => {
    const script = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../installer.nsh"), "utf8");
    assert.ok(script.includes(UNINSTALL_PATHS_FILE), "fichier de liste absent du script");
    assert.ok(script.includes(GAMES_MARKER), "fichier repère absent du script");
    assert.match(script, /\$\{isUpdated\}/); // mise à jour : aucune suppression
    assert.match(script, /updater-details\.flag/); // repli : le flag écrit par l'application
    assert.match(script, /\\instances/); // seuls des dossiers « instances »
  });
});
