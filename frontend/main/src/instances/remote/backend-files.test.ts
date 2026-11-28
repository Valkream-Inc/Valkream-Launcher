import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import type { GamePlatform, ReleaseEntry } from "@shared/types";
import { manifestHash } from "../install/state/manifest.js";
import instancesConfig from "../instances.config.js";
import { parseData } from "../../lib/format/parse-data.js";
import { ParamResolver } from "./ParamResolver.js";
import { flattenRelease, RELEASE_TIERS } from "./release-options.js";
import { validateReleaseConfig, validateRemoteIndex } from "./validate.js";
import { allVariantContexts, resolveVariants } from "./variants.js";

/**
 * Vérifie le dossier `backend/public` contre la config main : chaque instance du main a son
 * `index.config.json`, ses latest valides sur chaque plateforme, un dossier d'installation
 * pour chaque entrée, des hash de manifeste cohérents et des fichiers liés présents.
 */

const backendPublic = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../../backend/public");
const local = (link: string) =>
  path.join(backendPublic, link.replace(/^\//, ""));
/** YAML ou JSON, détecté par l'extension du fichier (comme le launcher). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const readData = async (link: string): Promise<any> => parseData(fs.readFileSync(local(link), "utf8"), link);

const resolver = new ParamResolver({
  baseUrl: "https://files.test",
  fetchText: async (url) =>
    fs.readFileSync(local(new URL(url).pathname), "utf8"),
});

const PLATFORMS: GamePlatform[] = ["win32", "linux", "darwin"];

for (const config of instancesConfig) {
  describe(`backend/public : ${config.id}`, async () => {
    const index = await readData(config.indexUrl);

    it("l'index est dans le dossier du jeu et valide", () => {
      assert.match(config.indexUrl, new RegExp(`^/games/${config.id}/index\\.config\\.(json|ya?ml)$`));
      const result = validateRemoteIndex(index, config.id);
      assert.equal(result.ok, true, result.errors.join(" | "));
    });

    it("les fichiers liés par l'index (toutes variantes) existent et se lisent", async () => {
      for (const context of allVariantContexts()) {
        const resolved = resolveVariants(index, context) as Record<string, unknown>;
        for (const key of ["event", "maintenance", "contributors", "mods"]) {
          if (typeof resolved[key] === "string") await readData(resolved[key] as string);
        }
      }
    });

    for (const [channel, link] of Object.entries<string>(
      index.channels ?? {},
    )) {
      for (const platform of PLATFORMS) {
        it(`${channel} / ${platform} : latest valide, chaque entrée a son dossier dans la config main`, async () => {
          const raw = (await readData(link)) as Record<string, any>;
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

      it(`${channel} : hash des manifestes du dépôt cohérents`, async () => {
        const raw = (await readData(link)) as Record<string, any>;
        for (const tier of RELEASE_TIERS) {
          for (const [name, entry] of Object.entries<ReleaseEntry>(
            raw[tier] ?? {},
          )) {
            if (
              entry.type === "hash_url" &&
              typeof entry.content === "string" &&
              fs.existsSync(local(entry.content))
            ) {
              const manifest = await readData(entry.content);
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

    it("toute entrée du main correspond à une entrée du latest (pas de chemin orphelin)", async () => {
      const names = new Set<string>();
      for (const link of Object.values<string>(index.channels ?? {})) {
        const raw = (await readData(link)) as Record<string, any>;
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
