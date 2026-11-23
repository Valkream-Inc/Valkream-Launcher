/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Les exemples de `doc/instance-system/examples` doivent rester valides (modèles à copier).
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import yaml from "yaml";

import type { GamePlatform } from "@shared/types";
import { ParamResolver } from "./ParamResolver.js";
import { flattenRelease } from "./release-options.js";
import { validateReleaseConfig, validateRemoteIndex } from "./validate.js";

const examples = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../../doc/instance-system/examples");
const resolver = new ParamResolver({ baseUrl: "https://files.test", fetchText: async () => "{}" });
const PLATFORMS: GamePlatform[] = ["win32", "linux"];

const check = (folder: string, file: string, entryPaths: Record<string, string>) => {
  for (const platform of PLATFORMS) {
    it(`${folder}/${file} : valide sur ${platform}`, async () => {
      const raw = yaml.parse(fs.readFileSync(path.join(examples, folder, file), "utf8"));
      const { release, errors } = await flattenRelease(raw, platform, resolver, entryPaths);
      assert.deepEqual([...errors, ...validateReleaseConfig(release).errors], []);
    });
  }
};

describe("exemples d'instances", () => {
  check("valheim-alpha-steam", "latest.alpha.yml", {
    valheim: "game", bepinex: "game", "mods-thunderstore": "game/BepInEx/plugins",
  });
  check("minecraft-java", "latest.yml", { java: "java", minecraft: "game", mods: "game/mods" });

  it("minecraft-java : index valide", () => {
    const index = JSON.parse(fs.readFileSync(path.join(examples, "minecraft-java/index.config.json"), "utf8"));
    const result = validateRemoteIndex(index, "Minecraft-Example");
    assert.equal(result.ok, true, result.errors.join(" | "));
  });
});
