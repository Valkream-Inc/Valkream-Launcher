import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validateReleaseConfig, validateRemoteIndex } from "./validate.js";

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

describe("paramètres par canal", () => {
  it("accepte une valeur par canal (lien ou données) pour les quatre champs", () => {
    const index = {
      ...validIndex(),
      event: { stable: "/e.json", beta: { name: "e" } },
      maintenance: { default: "/m.json", alpha: { enabled: true } },
      mods: { stable: [{ name: "m" }], beta: "/mods.json" },
      contributors: { default: [{ name: "c" }] },
    };
    assert.equal(validateRemoteIndex(index).ok, true);
  });

  it("signale le canal fautif", () => {
    const index = {
      ...validIndex(),
      event: { stable: "/e.json", beta: "pas-un-lien" },
      mods: { alpha: [{ icon: "x" }] },
    };
    const errors = errorsOf(validateRemoteIndex(index));
    assert.match(errors, /index\.event : lien invalide.*\[canal beta\]/);
    assert.match(errors, /index\.mods\[0\] : « name » requis \[canal alpha\]/);
  });

  it("toute clé peut être déclinée par plateforme et par langue, en profondeur", () => {
    const index = {
      ...validIndex(),
      event: { stable: { win32: { fr: "/e-fr.json", en: "/e-en.json" } }, default: "/e.json" },
      requiredSpaceMb: { win32: 3000, linux: 2000 },
      mods: { fr: [{ name: "m" }], en: "/mods-en.json" },
    };
    assert.equal(validateRemoteIndex(index).ok, true);
  });

  it("une variante fautive est localisée (plateforme et langue)", () => {
    const index = { ...validIndex(), event: { linux: { en: "pas-un-lien", fr: "/e.json" }, default: "/e.json" } };
    assert.match(errorsOf(validateRemoteIndex(index)), /index\.event : lien invalide.*\[plateforme linux, langue en\]/);
  });

  it("un événement avec ses propres champs n'est pas pris pour une table de canaux", () => {
    assert.equal(validateRemoteIndex({ ...validIndex(), event: { name: "stable", stable: "x" } }).ok, true);
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

  it("nexus : liste jeu-idMod-idFichier, local: et key acceptés", () => {
    const entry = { ...validEntry(), type: "nexus_modpack_url", content: ["valheim-1234-5678", "Auteur-Nom-1.0.0"], key: "mods" };
    const errors = errorsOf(validateReleaseConfig({ version: "0.0.0", "game-details": { mods: entry } }));
    assert.match(errors, /content\[1\] : « jeu-idMod-idFichier »/);
    assert.doesNotMatch(errors, /content\[0\]|\.key/);
    const local = { ...validEntry(), type: "nexus_modpack_url", content: "local:cfg/nexus.json" };
    assert.equal(errorsOf(validateReleaseConfig({ version: "0.0.0", "game-details": { mods: local } })), "");
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

  it("key : réservé à hash_url / thunderstore, chemin pointé valide", () => {
    const ok = { ...validEntry(), type: "hash_url", "hash-folder": "/h/", key: "dependencies.mods" };
    assert.doesNotMatch(errorsOf(validateReleaseConfig({ version: "0.0.0", "game-base": { v: ok } })), /key/);
    const bad = { ...ok, key: "a..b" };
    assert.match(errorsOf(validateReleaseConfig({ version: "0.0.0", "game-base": { v: bad } })), /key : chemin pointé/);
    const zip = { ...validEntry(), type: "zip_url", content: "/a.zip", key: "x" };
    assert.match(errorsOf(validateReleaseConfig({ version: "0.0.0", "game-base": { v: zip } })), /key : réservé/);
  });

  it("content local:<entrée>/<fichier> : réservé à hash_url / thunderstore, chemin sûr", () => {
    const ok = { ...validEntry(), type: "thunderstore_modpack_url", content: "local:cfg/modpack.json" };
    assert.doesNotMatch(errorsOf(validateReleaseConfig({ version: "0.0.0", "game-details": { v: ok } })), /local/);
    const bad = { ...ok, content: "local:cfg/../secret.json" };
    assert.match(errorsOf(validateReleaseConfig({ version: "0.0.0", "game-details": { v: bad } })), /local:<entrée>/);
    const zip = { ...validEntry(), type: "zip_url", content: "local:cfg/a.zip" };
    assert.match(errorsOf(validateReleaseConfig({ version: "0.0.0", "game-details": { v: zip } })), /réservé/);
  });

  it("steam_library : hash-folder facultatif, buildid autorisé seulement ici", () => {
    const ok = { ...validEntry(), type: "steam_library", content: "/manifest.json", buildid: 123 };
    delete (ok as Record<string, unknown>)["hash-folder"];
    assert.doesNotMatch(errorsOf(validateReleaseConfig({ version: "0.0.0", "game-base": { v: ok } })), /hash-folder|buildid|type/);
    const zip = { ...validEntry(), type: "zip_url", content: "/a.zip", buildid: 1 };
    assert.match(errorsOf(validateReleaseConfig({ version: "0.0.0", "game-base": { v: zip } })), /buildid : réservé/);
  });

  it("depot_steam : depot obligatoire, hash-folder facultatif, buildid autorisé", () => {
    const base = { ...validEntry(), type: "depot_steam", content: "/manifest.json", buildid: 123 };
    delete (base as Record<string, unknown>)["hash-folder"];
    const check = (entry: Record<string, unknown>) => errorsOf(validateReleaseConfig({ version: "0.0.0", "game-base": { v: entry } }));
    assert.match(check(base), /depot : requis pour depot_steam/);
    assert.doesNotMatch(check({ ...base, depot: { id: 7, manifest: "123456789" } }), /depot|hash-folder|buildid|type/);
    assert.match(check({ ...base, depot: { id: "x", manifest: "1" } }), /depot : \{ id, manifest \}/);
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

  it("dependencies : thunderstore uniquement, skip = liste de textes", () => {
    const entry = (extra: object, type = "thunderstore_modpack_url") => ({
      version: "1", type, content: ["Au-A-1.0.0"], path: "game", ...extra,
    });
    const check = (value: object) => errorsOf(validateReleaseConfig({ version: "0.0.0", "game-details": { v: value } }));
    assert.equal(check(entry({ dependencies: { skip: ["a-b"] } })), "");
    assert.match(check(entry({ dependencies: {} }, "zip_url")), /dependencies : réservé à thunderstore/);
    assert.match(check(entry({ dependencies: { skip: [1] } })), /dependencies.skip/);
  });
});
