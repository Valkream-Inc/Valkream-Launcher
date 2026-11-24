import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ServerInfos } from "@shared/types";
import type { InstanceMainConfig } from "../instances.types.js";
import { InstanceInfos } from "./InstanceInfos.js";
import type { ParamResolver } from "../remote/ParamResolver.js";

const config: InstanceMainConfig = {
  id: "g", server: { type: "valheim", host: "h", port: 1, timeout: 1 }, indexUrl: "/index.json", entryPaths: {},
};

const make = (remote: Record<string, unknown>, now = () => 0) => {
  let indexLoads = 0;
  const resolver = {
    urlOf: (link: string) => (link.startsWith("http") ? link : `https://files.test${link}`),
    getJson: async (param: unknown) => {
      if (typeof param !== "string") return { value: param, source: "inline" };
      if (param === "/index.json") indexLoads++;
      if (!(param in remote)) throw new Error(`404 ${param}`);
      return { value: remote[param], source: "online" };
    },
  } as unknown as ParamResolver;
  const online: ServerInfos = { status: "server online", players: { online: 1, max: 2 }, ping: 5 };
  const infos = new InstanceInfos({ configs: [config], resolver, platform: "win32", queryServer: async () => online, now });
  return { infos, loads: () => indexLoads, online };
};

const index = (extra: object) => ({ schemaVersion: 1, id: "g", enabled: { win32: true }, channels: { stable: "/s.yml" }, ...extra });

describe("InstanceInfos", () => {
  it("serveur + événement (image relative résolue) + maintenance", async () => {
    const { infos, online } = make({
      "/index.json": index({ event: "/e.json", maintenance: { enabled: true, description: "d", end_date: "2026-01-01" } }),
      "/e.json": { name: "E", enabled: true, date: "2026-01-01", description: "d", image: "/img.png", link: "https://x" },
    });
    const result = await infos.get("g");
    assert.deepEqual(result.serverInfos, online);
    assert.equal(result.event && result.event.image, "https://files.test/img.png");
    assert.equal(result.maintenance && result.maintenance.enabled, true);
  });

  it("événement et maintenance différents selon le canal (cache séparé, repli sur stable)", async () => {
    const { infos } = make({
      "/index.json": index({
        event: { stable: "/e.json", beta: "/eb.json" },
        maintenance: { beta: { enabled: true, description: "beta", end_date: "2026-01-01" } },
      }),
      "/e.json": { name: "stable" },
      "/eb.json": { name: "beta" },
    });
    const stable = await infos.get("g", "stable");
    const beta = await infos.get("g", "beta");
    const alpha = await infos.get("g", "alpha");
    assert.equal(stable.event && stable.event.name, "stable");
    assert.equal(beta.event && beta.event.name, "beta");
    assert.equal(alpha.event && alpha.event.name, "stable");
    assert.equal(stable.maintenance, false);
    assert.equal(beta.maintenance && beta.maintenance.description, "beta");
  });

  it("image data: conservée ; événement absent ou en erreur : false", async () => {
    const withData = make({ "/index.json": index({ event: "/e.json" }), "/e.json": { image: "data:image/png;base64,AAAA" } });
    assert.equal(((await withData.infos.get("g")).event as { image: string }).image, "data:image/png;base64,AAAA");

    const missing = make({ "/index.json": index({ event: "/nope.json" }) });
    const r = await missing.infos.get("g");
    assert.deepEqual([r.event, r.maintenance], [false, false]);
  });

  it("index injoignable : pas d'exception, le serveur est quand même interrogé", async () => {
    const { infos, online } = make({});
    const r = await infos.get("g");
    assert.deepEqual([r.serverInfos, r.event, r.maintenance], [online, false, false]);
  });

  it("l'index n'est pas relu à chaque appel (TTL), puis l'est une fois expiré", async () => {
    let time = 0;
    const { infos, loads } = make({ "/index.json": index({}) }, () => time);
    await infos.get("g");
    await infos.get("g");
    assert.equal(loads(), 1);
    time = 6000;
    await infos.get("g");
    assert.equal(loads(), 2);
  });

  it("instance inconnue : lève", async () => {
    await assert.rejects(() => make({}).infos.get("nope"), /inconnue/);
  });

  it("requête serveur de jeu partagée pendant 4 s, puis renouvelée", async () => {
    let clock = 0;
    let queries = 0;
    const resolver = { urlOf: (l: string) => l, getJson: async () => ({ value: index({}), source: "online" }) } as unknown as ParamResolver;
    const online: ServerInfos = { status: "server online", players: { online: 1, max: 2 }, ping: 5 };
    const infos = new InstanceInfos({
      configs: [config], resolver, platform: "win32", now: () => clock,
      queryServer: async () => (queries++, online),
    });
    await Promise.all([infos.get("g"), infos.get("g")]);
    clock = 3000;
    await infos.get("g");
    assert.equal(queries, 1);
    clock = 4500;
    await infos.get("g");
    assert.equal(queries, 2);
  });
});
