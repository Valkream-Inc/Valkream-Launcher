import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import yaml from "yaml";

import { manifestHash } from "./manifest";
import { validateReleaseConfig, validateRemoteIndex } from "./validate";

const backendPublic = path.resolve(__dirname, "../../../../backend/public");
const readJson = (file: string) => JSON.parse(fs.readFileSync(path.join(backendPublic, file), "utf8"));
const readYaml = (file: string) => yaml.parse(fs.readFileSync(path.join(backendPublic, file), "utf8"));

const validIndex = () => ({
  schemaVersion: 1,
  instances: [{ id: "Valheim-v2", enabled: { win32: true } }],
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

describe("fichiers d'exemple du backend", () => {
  it("l'index d'exemple est valide", () => {
    const result = validateRemoteIndex(readJson("index.config.json"));
    assert.equal(result.ok, true, errorsOf(result));
  });

  it("le latest.beta.yml d'exemple est valide et le canal beta est déclaré dans l'index", () => {
    const result = validateReleaseConfig(readYaml("games/Valheim-Valkream-v2/latest.beta.yml"), ["game"]);
    assert.equal(result.ok, true, errorsOf(result));
    const index = readJson("index.config.json");
    assert.equal(index.instances[0].channels.beta, "/games/Valheim-Valkream-v2/latest.beta.yml");
  });

  it("le latest.yml d'exemple est valide pour les chemins de la config main", () => {
    const result = validateReleaseConfig(readYaml("games/Valheim-Valkream-v2/latest.yml"), ["game"]);
    assert.equal(result.ok, true, errorsOf(result));
  });
});

describe("validateRemoteIndex", () => {
  it("accepte un index minimal", () => {
    assert.equal(validateRemoteIndex(validIndex()).ok, true);
  });

  it("refuse un tableau à la racine (format du brouillon)", () => {
    const result = validateRemoteIndex([{ id: "x", enabled: { windows: true } }]);
    assert.equal(result.ok, false);
  });

  it("refuse une mauvaise schemaVersion", () => {
    const index = { ...validIndex(), schemaVersion: 2 };
    assert.match(errorsOf(validateRemoteIndex(index)), /schemaVersion/);
  });

  it("refuse la plateforme « windows » (la clé est win32)", () => {
    const index = { schemaVersion: 1, instances: [{ id: "x", enabled: { windows: true } }] };
    assert.match(errorsOf(validateRemoteIndex(index)), /windows : plateforme inconnue/);
  });

  it("refuse un id dangereux et les doublons", () => {
    const index = {
      schemaVersion: 1,
      instances: [
        { id: "../etc", enabled: {} },
        { id: "a", enabled: {} },
        { id: "a", enabled: {} },
      ],
    };
    const errors = errorsOf(validateRemoteIndex(index));
    assert.match(errors, /instances\[0\]\.id/);
    assert.match(errors, /doublon « a »/);
  });

  it("valide les liens des canaux et des paramètres", () => {
    const index = {
      schemaVersion: 1,
      instances: [
        {
          id: "a",
          enabled: { win32: true },
          channels: { stable: "/ok.yml", beta: "pas-un-lien", nightly: "/x" },
          event: "binary",
          mods: [{ icon: "x" }],
          contributors: [{ name: "ok" }],
        },
      ],
    };
    const errors = errorsOf(validateRemoteIndex(index));
    assert.match(errors, /channels\.beta : lien invalide/);
    assert.match(errors, /channels\.nightly : canal inconnu/);
    assert.match(errors, /\.event : lien invalide/);
    assert.match(errors, /mods\[0\] : « name » requis/);
    assert.doesNotMatch(errors, /contributors/);
  });

  it("accepte des paramètres inline", () => {
    const index = {
      schemaVersion: 1,
      instances: [{ id: "a", enabled: {}, event: { name: "e" }, mods: [{ name: "m" }] }],
    };
    assert.equal(validateRemoteIndex(index).ok, true);
  });
});

describe("validateReleaseConfig", () => {
  it("accepte une release minimale", () => {
    assert.equal(validateReleaseConfig(validRelease(), ["game"]).ok, true);
  });

  it("refuse une version globale mal formée", () => {
    assert.match(errorsOf(validateReleaseConfig({ ...validRelease(), version: "1.2.3.4" })), /X0\.X1\.X2 attendu/);
  });

  it("attrape la faute « game-notbreacking » du brouillon", () => {
    const release = { ...validRelease(), "game-notbreacking": { configs: validEntry() } };
    assert.match(errorsOf(validateReleaseConfig(release)), /game-notbreacking : clé inconnue/);
  });

  it("refuse un path hors liste blanche ou qui sort de la racine", () => {
    const outside = { ...validRelease(), "game-base": { valheim: { ...validEntry(), path: "other" } } };
    assert.match(errorsOf(validateReleaseConfig(outside, ["game"])), /n'est pas autorisé/);

    const escape = { ...validRelease(), "game-base": { valheim: { ...validEntry(), path: "game/../../etc" } } };
    assert.match(errorsOf(validateReleaseConfig(escape, ["game"])), /chemin relatif sûr/);
  });

  it("refuse un nom d'entrée dupliqué entre niveaux", () => {
    const release = {
      version: "0.0.0",
      "game-base": { configs: validEntry() },
      "game-details": { configs: validEntry() },
    };
    assert.match(errorsOf(validateReleaseConfig(release)), /déjà utilisé dans game-base/);
  });

  it("refuse les contenus du brouillon qui ne sont pas des liens", () => {
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

  it("champs réservés : folder_in_zip à zip_url, api-url à thunderstore/nexus", () => {
    const entry = { ...validEntry(), type: "hash_url", "hash-folder": "/h/", folder_in_zip: "x", "api-url": "https://a.b" };
    const errors = errorsOf(validateReleaseConfig({ version: "0.0.0", "game-base": { v: entry } }));
    assert.match(errors, /folder_in_zip : réservé à zip_url/);
    assert.match(errors, /api-url : réservé/);
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
});

describe("backend/public : toutes les instances de l'index", () => {
  const index = readJson("index.config.json");
  const local = (link: string) => path.join(backendPublic, link.replace(/^\//, ""));

  for (const instance of index.instances) {
    it(`${instance.id} : canaux valides, hash du manifeste cohérent, fichiers liés présents`, () => {
      for (const [channel, link] of Object.entries<string>(instance.channels)) {
        const release = readYaml(link);
        const result = validateReleaseConfig(release, ["game"]);
        assert.equal(result.ok, true, `${instance.id}@${channel} : ${result.errors.join(" | ")}`);

        for (const tier of ["game-base", "game-details"]) {
          for (const [name, entry] of Object.entries<any>(release[tier] ?? {})) {
            // Manifeste présent dans le repo : le hash déclaré doit être celui du manifeste.
            if (entry.type === "hash_url" && typeof entry.content === "string" && fs.existsSync(local(entry.content))) {
              const manifest = JSON.parse(fs.readFileSync(local(entry.content), "utf8"));
              assert.equal(entry.hash, manifestHash(manifest, entry.to_ignore ?? []), `${instance.id}@${channel}.${name}`);
            }
          }
        }
      }
      for (const key of ["event", "maintenance", "contributors", "mods"]) {
        if (instance[key] !== undefined) {
          assert.ok(fs.existsSync(local(instance[key])), `${instance.id}.${key} : fichier absent`);
          JSON.parse(fs.readFileSync(local(instance[key]), "utf8"));
        }
      }
    });
  }
});
