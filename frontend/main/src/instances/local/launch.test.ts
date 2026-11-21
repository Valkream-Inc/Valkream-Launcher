import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildLaunchArgs } from "./launch-args";
import { planLaunch } from "./launch";
import { ensureSteamRunning } from "./steam";

const locations = { installDir: "/d", executable: "/d/game/run.exe" };
const yes = { platform: "win32" as const, exists: () => true };

describe("planLaunch", () => {
  it("exécutable avec son dossier comme cwd, Steam non démarré par défaut", () => {
    assert.deepEqual(planLaunch({ steamAppId: 1 }, locations, {}, yes), {
      kind: "executable", path: "/d/game/run.exe", cwd: "/d/game", args: [], ensureSteam: false,
    });
  });

  it("launchSteam + steamAppId : on démarre Steam puis on lance l'exécutable du launcher", () => {
    const plan = planLaunch({ steamAppId: 892970 }, locations, { launchSteam: true }, yes);
    assert.equal(plan.kind, "executable");
    assert.equal(plan.kind === "executable" && plan.ensureSteam, true);
  });

  it("launchSteam sans steamAppId : ignoré", () => {
    const plan = planLaunch({}, locations, { launchSteam: true }, yes);
    assert.equal(plan.kind === "executable" && plan.ensureSteam, false);
  });

  it("sans exécutable : Steam lance le jeu si launchSteam, sinon erreur", () => {
    assert.deepEqual(planLaunch({ steamAppId: 5 }, { installDir: "/d" }, { launchSteam: true }), {
      kind: "steam", url: "steam://rungameid/5",
    });
    assert.throws(() => planLaunch({}, { installDir: "/d" }, {}), /Aucun exécutable/);
    assert.throws(() => planLaunch({}, locations, {}, { platform: "win32", exists: () => false }), /introuvable/);
  });

  it("command (java) : lancée depuis le PATH avec arguments et cwd", () => {
    const plan = planLaunch(
      {
        command: { win32: "java", linux: "java" },
        launchCwd: "game",
        launchArgs: ["-Xmx{ram}M", { when: "fullscreen", args: ["--fullscreen"] }, "-jar", "server.jar"],
      },
      { installDir: "/d" },
      { ram: 4096, fullscreen: true },
      { platform: "win32" },
    );
    assert.deepEqual(plan, {
      kind: "executable", path: "java", cwd: "/d/game",
      args: ["-Xmx4096M", "--fullscreen", "-jar", "server.jar"], ensureSteam: false,
    });
  });
});

describe("buildLaunchArgs", () => {
  const settings = { ram: 2048, hd: false, lang: "fr", name: "Joueur 1" };

  it("conditions : réglage actif, égal à une valeur, absent", () => {
    assert.deepEqual(
      buildLaunchArgs(
        [
          { when: "hd", args: ["--hd"] },
          { when: "lang", args: ["--lang"] },
          { when: "lang", equals: "en", args: ["--en"] },
          { when: "lang", equals: "fr", args: ["--fr"] },
          { when: "inconnu", args: ["--x"] },
        ],
        settings,
        "linux",
      ),
      ["--lang", "--fr"],
    );
  });

  it("valeur avec espaces : un seul argument (pas de shell)", () => {
    assert.deepEqual(buildLaunchArgs(["--name={name}"], settings, "linux"), ["--name=Joueur 1"]);
  });

  it("par plateforme, avec repli default", () => {
    const spec = { win32: ["--win"], default: ["--autre"] };
    assert.deepEqual(buildLaunchArgs(spec, {}, "win32"), ["--win"]);
    assert.deepEqual(buildLaunchArgs(spec, {}, "linux"), ["--autre"]);
    assert.deepEqual(buildLaunchArgs(undefined, {}, "linux"), []);
  });

  it("réglage inconnu dans un modèle : erreur claire", () => {
    assert.throws(() => buildLaunchArgs(["-X{nope}"], {}, "linux"), /« nope » inconnu/);
  });
});

describe("ensureSteamRunning", () => {
  const make = (runningAfter: number) => {
    let polls = 0;
    const opened: string[] = [];
    const slept: number[] = [];
    return {
      opened,
      slept,
      deps: {
        isRunning: async () => runningAfter >= 0 && polls++ >= runningAfter,
        open: async (url: string) => void opened.push(url),
        sleep: async (ms: number) => void slept.push(ms),
      },
    };
  };

  it("déjà lancé : rien à faire", async () => {
    const world = make(0);
    assert.equal(await ensureSteamRunning(world.deps), "already-running");
    assert.deepEqual(world.opened, []);
  });

  it("démarre Steam puis attend qu'il soit prêt", async () => {
    const world = make(3);
    assert.equal(await ensureSteamRunning(world.deps, { pollMs: 10, settleMs: 50 }), "started");
    assert.deepEqual(world.opened, ["steam://open/main"]);
    assert.equal(world.slept.at(-1), 50);
  });

  it("ne bloque jamais : délai dépassé → timeout", async () => {
    const world = make(-1);
    assert.equal(await ensureSteamRunning(world.deps, { timeoutMs: 100, pollMs: 50 }), "timeout");
  });
});
