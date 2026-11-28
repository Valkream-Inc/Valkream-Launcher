import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { describe, it } from "node:test";

import InfosManager from "./server-infos.js";

const listen = (port = 0) =>
  new Promise<http.Server>((resolve) => {
    const server = http.createServer((_req, res) => res.end("ok"));
    server.listen(port, "127.0.0.1", () => resolve(server));
  });

describe("InfosManager.getIsServerReachable", () => {
  it("un échec n'est jamais mémorisé : le retour du serveur est vu sans redémarrer", async () => {
    const first = await listen();
    const { port } = first.address() as AddressInfo;
    const url = `http://127.0.0.1:${port}/`;
    await new Promise((resolve) => first.close(resolve));

    assert.equal(await InfosManager.getIsServerReachable(url), false); // serveur éteint
    const second = await listen(port); // le serveur revient
    try {
      assert.equal(await InfosManager.getIsServerReachable(url), true);
    } finally {
      await new Promise((resolve) => second.close(resolve));
    }
  });
});
