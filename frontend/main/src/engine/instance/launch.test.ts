import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { planLaunch } from "./launch";

const locations = { installDir: "/d", executable: "/d/game/run.exe" };

describe("planLaunch", () => {
  it("Steam si le réglage est actif et l'app connue", () => {
    assert.deepEqual(planLaunch({ steamAppId: 892970 }, locations, { launchSteam: true }), {
      kind: "steam", url: "steam://rungameid/892970",
    });
  });

  it("exécutable sinon, avec son dossier comme cwd", () => {
    assert.deepEqual(planLaunch({ steamAppId: 1 }, locations, {}, () => true), {
      kind: "executable", path: "/d/game/run.exe", cwd: "/d/game",
    });
  });

  it("réglage Steam sans app Steam : retombe sur l'exécutable", () => {
    assert.equal(planLaunch({}, locations, { launchSteam: true }, () => true).kind, "executable");
  });

  it("erreurs claires : pas d'exécutable déclaré, exécutable absent", () => {
    assert.throws(() => planLaunch({}, { installDir: "/d" }, {}), /Aucun exécutable/);
    assert.throws(() => planLaunch({}, locations, {}, () => false), /introuvable/);
  });
});
