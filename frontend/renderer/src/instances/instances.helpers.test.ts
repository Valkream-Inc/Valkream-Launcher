import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EntryReport, InstanceSummary } from "@shared/types";
import { groupEntriesByPath, isSelectable, overlappingPaths, paginate, pickerChannels, resolveChannel, selectableChannels } from "./instances.helpers";

const entry = (name: string, path: string, status: EntryReport["status"]): EntryReport => ({
  name, tier: "game-base", type: "zip_url", path, declaredVersion: "1", status,
  preserved: [], toIgnore: [], errors: [],
});

describe("canaux", () => {
  it("stable toujours ; beta / alpha seulement si activés et proposés, dans l'ordre", () => {
    assert.deepEqual(selectableChannels(["stable", "alpha", "beta"], true), ["stable", "beta", "alpha"]);
    assert.deepEqual(selectableChannels(["stable", "beta"], false), ["stable"]);
    assert.deepEqual(selectableChannels(["stable"], true), ["stable"]);
    assert.deepEqual(selectableChannels(["beta"], true), ["beta"]);
  });

  it("resolveChannel : canal souhaité s'il est encore proposé, sinon null (retour au choix du jeu)", () => {
    assert.equal(resolveChannel("beta", ["stable", "beta"], true), "beta");
    assert.equal(resolveChannel("beta", ["stable", "beta"], false), null);
    assert.equal(resolveChannel("alpha", ["stable", "beta"], true), null);
    assert.equal(resolveChannel("stable", ["stable"], false), "stable");
    assert.equal(resolveChannel("stable", ["alpha"], true), null); // jeu sans stable
  });

  it("choix du jeu : un jeu sans canal proposé est masqué, sauf sans information du remote", () => {
    assert.deepEqual(pickerChannels(["alpha"], false), []); // alpha seulement, tests désactivés
    assert.deepEqual(pickerChannels(["alpha"], true), ["alpha"]);
    assert.deepEqual(pickerChannels(["beta"], true), ["beta"]); // pas de stable : pas d'entrée stable
    assert.deepEqual(pickerChannels(["stable", "beta"], false), ["stable"]);
    assert.deepEqual(pickerChannels([], false), []); // aucun canal déclaré : pas d'entrée (installations obsolètes)
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

describe("paginate", () => {
  const list = Array.from({ length: 25 }, (_, i) => i);
  it("découpe en pages et borne la page demandée", () => {
    assert.deepEqual(paginate(list, 1, 10).items, list.slice(0, 10));
    assert.deepEqual(paginate(list, 3, 10), { items: [20, 21, 22, 23, 24], page: 3, pageCount: 3 });
    assert.equal(paginate(list, 99, 10).page, 3);
    assert.equal(paginate(list, 0, 10).page, 1);
    assert.deepEqual(paginate([], 1, 10), { items: [], page: 1, pageCount: 1 });
  });
});
