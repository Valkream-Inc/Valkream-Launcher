import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import yaml from "yaml";

import type { GamePlatform, ReleaseEntry } from "@shared/types";
import { manifestHash } from "../install/manifest.js";
import instancesConfig from "../instances.config.js";
import { ParamResolver } from "./ParamResolver.js";
import { flattenRelease, RELEASE_TIERS } from "./release-options.js";
import { validateReleaseConfig, validateRemoteIndex } from "./validate.js";

/**
 * Vérifie le dossier `backend/public` contre la config main : chaque instance du main a son
 * `index.config.json`, ses latest valides sur chaque plateforme, un dossier d'installation
 * pour chaque entrée, des hash de manifeste cohérents et des fichiers liés présents.
 */

const backendPublic = path.resolve(__dirname, "../../../../../backend/public");
const local = (link: string) =>
  path.join(backendPublic, link.replace(/^\//, ""));
const readJson = (link: string) =>
  JSON.parse(fs.readFileSync(local(link), "utf8"));

const resolver = new ParamResolver({
  baseUrl: "https://files.test",
  fetchText: async (url) =>
    fs.readFileSync(local(new URL(url).pathname), "utf8"),
});

const PLATFORMS: GamePlatform[] = ["win32", "linux", "darwin"];

for (const config of instancesConfig) {
  describe(`backend/public : ${config.id}`, () => {
    const index = readJson(config.indexUrl);

    it("l'index.config.json est dans le dossier du jeu et valide", () => {
      assert.equal(config.indexUrl, `/games/${config.id}/index.config.json`);
      const result = validateRemoteIndex(index, config.id);
      assert.equal(result.ok, true, result.errors.join(" | "));
    });

    it("les fichiers liés par l'index existent et sont du JSON", () => {
      for (const key of ["event", "maintenance", "contributors", "mods"]) {
        if (typeof index[key] === "string")
          JSON.parse(fs.readFileSync(local(index[key]), "utf8"));
      }
    });

    for (const [channel, link] of Object.entries<string>(
      index.channels ?? {},
    )) {
      for (const platform of PLATFORMS) {
        it(`${channel} / ${platform} : latest valide, chaque entrée a son dossier dans la config main`, async () => {
          const raw = yaml.parse(fs.readFileSync(local(link), "utf8"));
          const { release, errors } = await flattenRelease(
            raw,
            platform,
            resolver,
            config.entryPaths,
          );
          const validation = validateReleaseConfig(release);
          assert.deepEqual([...errors, ...validation.errors], []);
        });
      }

      it(`${channel} : hash des manifestes du dépôt cohérents`, () => {
        const raw = yaml.parse(fs.readFileSync(local(link), "utf8"));
        for (const tier of RELEASE_TIERS) {
          for (const [name, entry] of Object.entries<ReleaseEntry>(
            raw[tier] ?? {},
          )) {
            if (
              entry.type === "hash_url" &&
              typeof entry.content === "string" &&
              fs.existsSync(local(entry.content))
            ) {
              const manifest = readJson(entry.content);
              assert.equal(
                entry.hash,
                manifestHash(manifest, entry.to_ignore ?? []),
                `${channel}.${name}`,
              );
            }
          }
        }
      });
    }

    it("toute entrée du main correspond à une entrée du latest (pas de chemin orphelin)", () => {
      const names = new Set<string>();
      for (const link of Object.values<string>(index.channels ?? {})) {
        const raw = yaml.parse(fs.readFileSync(local(link), "utf8"));
        for (const tier of RELEASE_TIERS)
          Object.keys(raw[tier] ?? {}).forEach((name) => names.add(name));
      }
      for (const name of Object.keys(config.entryPaths)) {
        assert.ok(
          names.has(name),
          `entryPaths.${name} : aucune entrée du même nom dans les latest`,
        );
      }
    });
  });
}
