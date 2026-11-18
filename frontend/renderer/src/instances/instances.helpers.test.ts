import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EntryReport, InstanceSummary } from "@shared/types";
import { groupEntriesByPath, isSelectable, overlappingPaths, pickChannel } from "./instances.helpers";

const entry = (name: string, path: string, status: EntryReport["status"]): EntryReport => ({
  name, tier: "game-base", type: "zip_url", path, declaredVersion: "1", status,
  blocking: true, preserved: [], toIgnore: [], errors: [],
});

describe("pickChannel", () => {
  it("beta seulement si activée et proposée", () => {
    assert.equal(pickChannel(true, ["stable", "beta"]), "beta");
    assert.equal(pickChannel(true, ["stable"]), "stable");
    assert.equal(pickChannel(false, ["stable", "beta"]), "stable");
  });
});

describe("isSelectable", () => {
  const summary = (availability: InstanceSummary["availability"]): InstanceSummary => ({
    id: "a", availability, channels: [], indexSource: "online", errors: [],
  });
  it("activée et décrite côté render", () => {
    assert.equal(isSelectable(summary("enabled"), ["a"]), true);
    assert.equal(isSelectable(summary("enabled"), ["b"]), false);
    assert.equal(isSelectable(summary("disabled"), ["a"]), false);
  });
});

describe("groupEntriesByPath", () => {
  it("une table par sous-chemin, échec détecté", () => {
    const tables = groupEntriesByPath([
      entry("a", "game", "up-to-date"),
      entry("b", "/game/", "outdated"),
      entry("c", "game/config", "skipped"),
    ]);
    assert.deepEqual(tables.map((t) => [t.path, t.entries.length, t.failing]), [
      ["game", 2, true],
      ["game/config", 1, false],
    ]);
  });
});

describe("overlappingPaths", () => {
  it("signale un chemin contenu dans un autre, pas deux frères", () => {
    assert.deepEqual(
      overlappingPaths([entry("a", "game", "up-to-date"), entry("b", "game/mods", "up-to-date"), entry("c", "game/cfg", "up-to-date")]),
      [["game", "game/mods"], ["game", "game/cfg"]],
    );
    assert.deepEqual(overlappingPaths([entry("a", "game/mods", "up-to-date"), entry("b", "game/mods2", "up-to-date")]), []);
  });
});
