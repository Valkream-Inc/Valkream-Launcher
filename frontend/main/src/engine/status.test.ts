import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { EntryReport, InstanceReport } from "@shared/types";
import { computeStatus } from "./status";

const entry = (name: string, tier: EntryReport["tier"], status: EntryReport["status"], optionalSetting?: string): EntryReport => ({
  name, tier, type: "zip_url", path: "game", declaredVersion: "1", status,
  blocking: tier !== "game-notbreaking", optionalSetting, preserved: [], toIgnore: [], errors: [],
});

const report = (entries: EntryReport[], extra: Partial<InstanceReport> = {}): InstanceReport => {
  const count = (status: EntryReport["status"]) => entries.filter((e) => e.status === status).length;
  return {
    id: "g", channel: "stable", installDir: "/d", releaseSource: "online", releaseVersion: "1.2.3.4",
    entries, installedCount: entries.filter((e) => e.status === "up-to-date").length,
    summary: {
      total: entries.length, upToDate: count("up-to-date"), outdated: count("outdated"),
      notInstalled: count("not-installed"), modified: count("modified"), skipped: count("skipped"), invalid: count("invalid"),
      blocking: entries.filter((e) => e.blocking && !["up-to-date", "skipped"].includes(e.status)).map((e) => e.name),
      works: false,
    },
    mods: [], contributors: [], settings: {}, errors: [], ...extra,
  };
};

const online = { isInternetConnected: true, isServerReachable: true };
const offline = { isInternetConnected: false, isServerReachable: false };

describe("computeStatus", () => {
  it("rien d'installé", () => {
    const s = computeStatus(report([entry("base", "game-base", "not-installed")]), online);
    assert.equal(s.isInstalled, false);
    assert.equal(s.canPlay, false);
  });

  it("tout à jour : jouable, version affichée", () => {
    const s = computeStatus(report([entry("base", "game-base", "up-to-date"), entry("cfg", "game-notbreaking", "up-to-date")]), online);
    assert.deepEqual([s.isInstalled, s.isUpToDate, s.isMajorUpdate, s.canPlay, s.gameVersion], [true, true, false, true, "1.2.3.4"]);
  });

  it("base en retard : mise à jour majeure, non jouable en ligne", () => {
    const s = computeStatus(report([entry("base", "game-base", "outdated")]), online);
    assert.deepEqual([s.isInstalled, s.isUpToDate, s.isMajorUpdate, s.canPlay], [true, false, true, false]);
  });

  it("config non bloquante en retard : mise à jour mineure, jouable", () => {
    const s = computeStatus(report([entry("base", "game-base", "up-to-date"), entry("cfg", "game-notbreaking", "outdated")]), online);
    assert.deepEqual([s.isUpToDate, s.isMajorUpdate, s.canPlay], [false, false, true]);
  });

  it("hors ligne : on joue ce qui est installé, même en retard", () => {
    const s = computeStatus(report([entry("base", "game-base", "outdated")]), offline);
    assert.equal(s.canPlay, true);
  });

  it("hors ligne sans remote lisible : état disque", () => {
    const none = report([], { installedCount: 3, errors: ["index : injoignable"] });
    assert.equal(computeStatus(none, offline).canPlay, true);
    assert.equal(computeStatus({ ...none, installedCount: 0 }, offline).canPlay, false);
  });

  it("entrées optionnelles actives listées, désactivées ignorées", () => {
    const s = computeStatus(report([
      entry("base", "game-base", "up-to-date"),
      entry("admin", "game-breaking", "up-to-date", "modsAdmin"),
      entry("fps", "game-breaking", "skipped", "boostFps"),
    ]), online);
    assert.deepEqual(s.activeOptionalSettings, ["modsAdmin"]);
  });
});
