/**
 * @author Valkream Team
 * @license MIT-NC
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import fr from "./fr";
import en from "./en";
import { buildSteamGuideText } from "./steam-guide";

const translator = (dict: unknown) => (key: string, vars: Record<string, unknown> = {}): string => {
  let node: unknown = dict;
  for (const part of key.split(".")) node = (node as Record<string, unknown> | undefined)?.[part];
  assert.equal(typeof node, "string", `clé manquante : ${key}`);
  return (node as string).replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(vars[name] ?? ""));
};

describe("mode d'emploi Steam (clés de traduction)", () => {
  const data = { entry: "Valheim", appId: 892970, branch: "public-test", expectedBuild: 123, installedBuild: "99", files: ["a", "b"] };
  for (const [name, dict] of [["fr", fr], ["en", en]] as const) {
    it(`${name} : toutes les clés existent et les variables sont remplies`, () => {
      const t = translator(dict);
      for (const issue of ["missing", "version"] as const) {
        const text = buildSteamGuideText(t, { issue, depotAvailable: true, depotOnly: false, guideData: data });
        assert.match(text, /Valheim/);
        assert.doesNotMatch(text, /\{\{/);
      }
      assert.match(buildSteamGuideText(t, { issue: "missing", depotAvailable: true, depotOnly: true, guideData: data }), /123/);
    });
  }
});
