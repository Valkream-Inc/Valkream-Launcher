import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { InstanceMainConfig } from "../instances.types";
import { InstanceRegistry } from "./InstanceRegistry";
import type { ParamResolver } from "./ParamResolver";

const server = { type: "valheim", host: "h", port: 1, timeout: 1 };
const config = (id: string, extra: Partial<InstanceMainConfig> = {}): InstanceMainConfig => ({
  id,
  server,
  indexUrl: `/games/${id}/index.config.json`,
  entryPaths: {},
  ...extra,
});

/** Un index par jeu : le résolveur répond selon le lien demandé. */
const fakeResolver = (indexes: Record<string, () => Promise<unknown>>) => {
  const calls: string[] = [];
  const resolver = {
    getJson: async (link: string) => {
      calls.push(link);
      const load = indexes[link];
      if (!load) throw new Error(`404 ${link}`);
      return load();
    },
  } as unknown as ParamResolver;
  return { resolver, calls };
};

const online = (value: unknown, source = "online") => async () => ({ value, source });

const indexOf = (id: string, extra: object) => ({ schemaVersion: 1, id, ...extra });

const list = (resolver: ParamResolver, configs: InstanceMainConfig[]) =>
  new InstanceRegistry({ configs, resolver, platform: "win32" }).list();

describe("InstanceRegistry", () => {
  it("lit l'index de chaque jeu, dans l'ordre des configs", async () => {
    const { resolver, calls } = fakeResolver({
      "/games/a/index.config.json": online(indexOf("a", { enabled: { win32: true }, channels: { stable: "/a.yml", beta: "/a.beta.yml" } })),
      "/games/b/index.config.json": online(indexOf("b", { enabled: { win32: false } })),
    });
    const result = await list(resolver, [config("b"), config("a")]);

    assert.deepEqual(result.map((r) => [r.id, r.availability]), [["b", "disabled"], ["a", "enabled"]]);
    assert.deepEqual(result[0].channels, []);
    assert.deepEqual(result[1].channels, ["stable", "beta"]);
    assert.equal(result[1].indexSource, "online");
    assert.equal(calls.length, 2);
  });

  it("les canaux ne viennent que de l'index : sans lien, pas de canal", async () => {
    const { resolver } = fakeResolver({
      "/games/c/index.config.json": online(indexOf("c", { enabled: { win32: true }, channels: { beta: "/c.beta.yml" } }), "cache"),
    });
    const [result] = await list(resolver, [config("c")]);
    assert.deepEqual(result.channels, ["beta"]);
    assert.equal(result.indexSource, "cache");
  });

  it("un index qui porte l'id d'un autre jeu est invalide", async () => {
    const { resolver } = fakeResolver({
      "/games/a/index.config.json": online(indexOf("autre", { enabled: { win32: true } })),
    });
    const [result] = await list(resolver, [config("a")]);
    assert.equal(result.availability, "invalid");
    assert.match(result.errors.join(" "), /attendu « a »/);
  });

  it("signale un index injoignable sans lever", async () => {
    const { resolver } = fakeResolver({ "/games/a/index.config.json": async () => { throw new Error("réseau coupé"); } });
    const [result] = await list(resolver, [config("a")]);
    assert.equal(result.availability, "unreachable");
    assert.equal(result.indexSource, "none");
    assert.deepEqual(result.errors, ["réseau coupé"]);
  });

  it("signale un index invalide avec ses erreurs", async () => {
    const { resolver } = fakeResolver({ "/games/a/index.config.json": online([{ id: "a" }]) });
    const [result] = await list(resolver, [config("a")]);
    assert.equal(result.availability, "invalid");
    assert.ok(result.errors.length > 0);
  });
});
