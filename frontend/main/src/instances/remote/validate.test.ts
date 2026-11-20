import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validateReleaseConfig, validateRemoteIndex } from "./validate";

const validIndex = () => ({
  schemaVersion: 1,
  id: "Valheim-v2",
  enabled: { win32: true },
});

const validEntry = () => ({
  version: "1.0.0",
  path: "game",
  type: "zip_url",
  content: "/games/x/game.zip",
});

const validRelease = () => ({
  version: "0.1.2",
  "game-base": { valheim: validEntry() },
});

const errorsOf = (result: { ok: boolean; errors: string[] }) => result.errors.join("\n");

describe("validateRemoteIndex", () => {
  it("accepte un index minimal", () => {
    assert.equal(validateRemoteIndex(validIndex()).ok, true);
  });

  it("refuse un tableau à la racine (ancien format)", () => {
    assert.equal(validateRemoteIndex([{ id: "x", enabled: { win32: true } }]).ok, false);
  });

  it("refuse l'ancien index global (liste d'instances)", () => {
    const result = validateRemoteIndex({ schemaVersion: 1, instances: [{ id: "x", enabled: {} }] });
    assert.equal(result.ok, false);
    assert.match(errorsOf(result), /index\.id/);
  });

  it("refuse une mauvaise schemaVersion", () => {
    const index = { ...validIndex(), schemaVersion: 2 };
    assert.match(errorsOf(validateRemoteIndex(index)), /schemaVersion/);
  });

  it("refuse la plateforme « windows » (la clé est win32)", () => {
    const index = { ...validIndex(), enabled: { windows: true } };
    assert.match(errorsOf(validateRemoteIndex(index)), /windows : plateforme inconnue/);
  });

  it("refuse un id dangereux ou différent de l'instance qui charge le fichier", () => {
    assert.match(errorsOf(validateRemoteIndex({ ...validIndex(), id: "../etc" })), /index\.id : identifiant invalide/);
    assert.match(errorsOf(validateRemoteIndex(validIndex(), "Autre")), /« Valheim-v2 » attendu « Autre »/);
    assert.equal(validateRemoteIndex(validIndex(), "Valheim-v2").ok, true);
  });

  it("valide les liens des canaux et des paramètres", () => {
    const index = {
      ...validIndex(),
      channels: { stable: "/ok.yml", beta: "pas-un-lien", nightly: "/x" },
      event: "binary",
      mods: [{ icon: "x" }],
      contributors: [{ name: "ok" }],
    };
    const errors = errorsOf(validateRemoteIndex(index));
    assert.match(errors, /channels\.beta : lien invalide/);
    assert.match(errors, /channels\.nightly : canal inconnu/);
    assert.match(errors, /\.event : lien invalide/);
    assert.match(errors, /mods\[0\] : « name » requis/);
    assert.doesNotMatch(errors, /contributors/);
  });

  it("accepte des paramètres inline", () => {
    const index = { ...validIndex(), enabled: {}, event: { name: "e" }, mods: [{ name: "m" }] };
    assert.equal(validateRemoteIndex(index).ok, true);
  });
});

describe("validateReleaseConfig", () => {
  it("accepte une release minimale", () => {
    assert.equal(validateReleaseConfig(validRelease()).ok, true);
  });

  it("refuse une version globale mal formée", () => {
    assert.match(errorsOf(validateReleaseConfig({ ...validRelease(), version: "1.2.3.4" })), /X0\.X1\.X2 attendu/);
  });

  it("attrape la faute « game-notbreacking »", () => {
    const release = { ...validRelease(), "game-notbreacking": { configs: validEntry() } };
    assert.match(errorsOf(validateReleaseConfig(release)), /game-notbreacking : clé inconnue/);
  });

  it("refuse une entrée sans dossier d'installation (absente de la config main) ou qui sort de la racine", () => {
    const { path: _removed, ...noPath } = validEntry();
    const missing = { ...validRelease(), "game-base": { valheim: noPath } };
    assert.match(errorsOf(validateReleaseConfig(missing)), /path : aucun dossier d'installation dans la config main/);

    const escape = { ...validRelease(), "game-base": { valheim: { ...validEntry(), path: "game/../../etc" } } };
    assert.match(errorsOf(validateReleaseConfig(escape)), /chemin relatif sûr/);
  });

  it("refuse un nom d'entrée dupliqué entre niveaux", () => {
    const release = {
      version: "0.0.0",
      "game-base": { configs: validEntry() },
      "game-details": { configs: validEntry() },
    };
    assert.match(errorsOf(validateReleaseConfig(release)), /déjà utilisé dans game-base/);
  });

  it("refuse les contenus qui ne sont pas des liens", () => {
    const release = {
      version: "0.0.0",
      "game-base": {
        bepinex: { ...validEntry(), content: { win32: "/ok.zip", linux: "htpp://something", darwin: "binary" } },
      },
    };
    const errors = errorsOf(validateReleaseConfig(release));
    assert.match(errors, /content\.linux : lien invalide/);
    assert.match(errors, /content\.darwin : lien invalide/);
    assert.doesNotMatch(errors, /content\.win32/);
  });

  it("hash_url : exige hash-folder et accepte un manifeste inline", () => {
    const entry = { ...validEntry(), type: "hash_url", content: { "/toto/x": "a".repeat(64) } };
    assert.match(errorsOf(validateReleaseConfig({ version: "0.0.0", "game-base": { v: entry } })), /hash-folder/);

    const withFolder = { ...entry, "hash-folder": "/games/x/hash/" };
    assert.equal(validateReleaseConfig({ version: "0.0.0", "game-base": { v: withFolder } }).ok, true);

    const badHash = { ...withFolder, content: { "/toto/x": "pas-un-hash" } };
    assert.match(errorsOf(validateReleaseConfig({ version: "0.0.0", "game-base": { v: badHash } })), /sha256 attendu/);
  });

  it("thunderstore : liste Auteur-Nom-Version et api-url https", () => {
    const entry = {
      ...validEntry(),
      type: "thunderstore_modpack_url",
      "api-url": "https://thunderstore.io",
      content: ["JereKuusela-Infinity_Hammer-1.79.0", "mauvais"],
    };
    const errors = errorsOf(validateReleaseConfig({ version: "0.0.0", "game-details": { mods: entry } }));
    assert.match(errors, /content\[1\] : « Auteur-Nom-Version » attendu/);
    assert.doesNotMatch(errors, /api-url/);
  });

  it("champs réservés : folder_in_zip à zip_url/hash_url, zip à hash_url, api-url à thunderstore/nexus", () => {
    const entry = { ...validEntry(), type: "hash_url", "hash-folder": "/h/", folder_in_zip: "x", "api-url": "https://a.b" };
    const errors = errorsOf(validateReleaseConfig({ version: "0.0.0", "game-base": { v: entry } }));
    assert.doesNotMatch(errors, /folder_in_zip/);
    assert.match(errors, /api-url : réservé/);

    const other = { ...validEntry(), type: "zip_url", content: "/a.zip", zip: "/b.zip" };
    assert.match(errorsOf(validateReleaseConfig({ version: "0.0.0", "game-base": { v: other } })), /zip : réservé à hash_url/);
    const bad = { ...entry, zip: "pas un lien" };
    assert.match(errorsOf(validateReleaseConfig({ version: "0.0.0", "game-base": { v: bad } })), /zip : lien de l'archive attendu/);
  });

  it("gameFolderToRemove/Preserve et optional sont contrôlés", () => {
    const entry = { ...validEntry(), gameFolderToRemove: ["/BepInEx/cache", "../x"], gameFolderToPreserve: "pas-une-liste", optional: {} };
    const errors = errorsOf(validateReleaseConfig({ version: "0.0.0", "game-base": { v: entry } }));
    assert.match(errors, /gameFolderToRemove\[1\]/);
    assert.doesNotMatch(errors, /gameFolderToRemove\[0\]/);
    assert.match(errors, /gameFolderToPreserve : tableau attendu/);
    assert.match(errors, /optional : \{ setting/);
  });
});

describe("gameFolderToPreserve et to_ignore", () => {
  const release = (extra: Record<string, unknown>) => ({
    version: "0.1.2",
    "game-base": { valheim: { ...validEntry(), ...extra } },
  });

  it("accepte chemins, règles { path, from } et motifs", () => {
    const result = validateReleaseConfig(
      release({
        gameFolderToPreserve: ["saves", { path: "config/client.cfg", from: ">=1.2.0" }],
        to_ignore: ["logs", "*.tmp"],
      }),
    );
    assert.equal(result.ok, true, errorsOf(result));
  });

  it("refuse une plage de versions invalide, une clé inconnue et un chemin qui sort", () => {
    const result = validateReleaseConfig(
      release({
        gameFolderToPreserve: [
          { path: "a", from: "latest" },
          { path: "b", fromm: "1.0.0" },
          "../hors",
          42,
        ],
        to_ignore: ["../logs"],
      }),
    );
    assert.equal(result.ok, false);
    const text = errorsOf(result);
    assert.match(text, /gameFolderToPreserve\[0\]\.from/);
    assert.match(text, /gameFolderToPreserve\[1\]\.fromm/);
    assert.match(text, /gameFolderToPreserve\[2\]/);
    assert.match(text, /gameFolderToPreserve\[3\]/);
    assert.match(text, /to_ignore\[0\]/);
  });

  it("requiredSpaceMb de l'index : nombre positif", () => {
    const base = { schemaVersion: 1, id: "g", enabled: { win32: true } };
    assert.equal(validateRemoteIndex({ ...base, requiredSpaceMb: 2048 }, "g").ok, true);
    for (const bad of [0, -5, "10", Number.NaN]) {
      assert.equal(validateRemoteIndex({ ...base, requiredSpaceMb: bad }, "g").ok, false, String(bad));
    }
  });
});
