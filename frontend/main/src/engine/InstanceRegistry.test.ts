import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { InstanceMainConfig } from "../types/instances";
import { InstanceRegistry } from "./InstanceRegistry";
import type { ParamResolver } from "./ParamResolver";

const server = { type: "valheim", host: "h", port: 1, timeout: 1 };
const config = (id: string, extra: Partial<InstanceMainConfig> = {}): InstanceMainConfig => ({
  id,
  server,
  indexUrl: "/index.config.json",
  allowedPaths: ["game"],
  ...extra,
});

const fakeResolver = (result: () => Promise<unknown>) => {
  let calls = 0;
  const resolver = {
    getJson: async () => {
      calls++;
      return result();
    },
  } as unknown as ParamResolver;
  return { resolver, calls: () => calls };
};

const index = {
  schemaVersion: 1,
  instances: [
    { id: "a", enabled: { win32: true }, channels: { stable: "/a.yml", beta: "/a.beta.yml" } },
    { id: "b", enabled: { win32: false } },
    { id: "c", enabled: { win32: true } },
  ],
};

const list = (resolver: ParamResolver, configs: InstanceMainConfig[]) =>
  new InstanceRegistry({ configs, resolver, platform: "win32" }).list();

describe("InstanceRegistry", () => {
  it("croise configs main et index, dans l'ordre des configs", async () => {
    const { resolver } = fakeResolver(async () => ({ value: index, source: "online" }));
    const result = await list(resolver, [config("b"), config("a"), config("zzz")]);

    assert.deepEqual(
      result.map((r) => [r.id, r.availability]),
      [["b", "disabled"], ["a", "enabled"], ["zzz", "not-in-index"]],
    );
    assert.deepEqual(result[1].channels, ["stable", "beta"]);
    assert.equal(result[1].indexSource, "online");
  });

  it("utilise gameUrl comme repli du canal stable", async () => {
    const { resolver } = fakeResolver(async () => ({ value: index, source: "cache" }));
    const [withFallback, without] = await list(resolver, [
      config("c", { gameUrl: "/c.yml" }),
      config("c"),
    ]);
    assert.deepEqual(withFallback.channels, ["stable"]);
    assert.deepEqual(without.channels, []);
    assert.equal(withFallback.indexSource, "cache");
  });

  it("ne télécharge l'index qu'une fois pour plusieurs instances", async () => {
    const { resolver, calls } = fakeResolver(async () => ({ value: index, source: "online" }));
    await list(resolver, [config("a"), config("b"), config("c")]);
    assert.equal(calls(), 1);
  });

  it("signale un index injoignable sans lever", async () => {
    const { resolver } = fakeResolver(async () => { throw new Error("réseau coupé"); });
    const [result] = await list(resolver, [config("a")]);
    assert.equal(result.availability, "unreachable");
    assert.equal(result.indexSource, "none");
    assert.deepEqual(result.errors, ["réseau coupé"]);
  });

  it("signale un index invalide avec ses erreurs", async () => {
    const { resolver } = fakeResolver(async () => ({ value: [{ id: "a" }], source: "online" }));
    const [result] = await list(resolver, [config("a")]);
    assert.equal(result.availability, "invalid");
    assert.ok(result.errors.length > 0);
  });
});
