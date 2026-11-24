/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";

import type { InstanceSummary } from "@shared/types";

import { deprecatedInstalls, scanInstalledInstances } from "./installed-scan.js";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "installed-scan-"));
after(() => fs.rmSync(root, { recursive: true, force: true }));

const summary = (over: Partial<InstanceSummary>): InstanceSummary => ({
  id: "g",
  availability: "enabled",
  channels: ["stable", "beta"],
  indexSource: "online",
  errors: [],
  ...over,
});

describe("installations du disque", () => {
  it("liste les dossiers <id>/<canal> et ignore le reste", () => {
    for (const dir of ["g/stable", "g/alpha", "vieux/stable", "g/autre"]) fs.mkdirSync(path.join(root, "instances", dir), { recursive: true });
    fs.mkdirSync(path.join(root, "instances.moving"), { recursive: true });
    fs.writeFileSync(path.join(root, "instances", "fichier.txt"), "x");
    const found = scanInstalledInstances(root).map((item) => `${item.id}/${item.channel}`).sort();
    assert.deepEqual(found, ["g/alpha", "g/stable", "vieux/stable"]);
    assert.deepEqual(scanInstalledInstances(path.join(root, "absent")), []);
  });

  it("obsolète : id retiré, instance désactivée, canal supprimé", () => {
    const installed = [
      { id: "vieux", channel: "stable" as const },
      { id: "g", channel: "alpha" as const },
      { id: "g", channel: "stable" as const },
      { id: "off", channel: "stable" as const },
    ];
    const result = deprecatedInstalls(installed, new Set(["g", "off"]), [summary({}), summary({ id: "off", availability: "disabled" })]);
    assert.deepEqual(result, [
      { id: "vieux", channel: "stable", reason: "removed" },
      { id: "g", channel: "alpha", reason: "channel-removed" },
      { id: "off", channel: "stable", reason: "disabled" },
    ]);
  });

  it("serveur injoignable ou sans canaux : rien n'est déclaré obsolète à tort", () => {
    const installed = [{ id: "g", channel: "alpha" as const }];
    assert.deepEqual(deprecatedInstalls(installed, new Set(["g"]), [summary({ availability: "unreachable", channels: [] })]), []);
    assert.deepEqual(deprecatedInstalls(installed, new Set(["g"]), [summary({ channels: [] })]), []);
  });
});
