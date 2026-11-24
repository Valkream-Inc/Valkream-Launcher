/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isChannelTable, pickChannel } from "./channel-value.js";

describe("valeur par canal", () => {
  it("reconnaît une table de canaux, pas des données", () => {
    assert.equal(isChannelTable({ stable: "/a" }), true);
    assert.equal(isChannelTable({ beta: "/b", default: "/d" }), true);
    assert.equal(isChannelTable({}), false);
    assert.equal(isChannelTable({ title: "t", stable: "x" }), false);
    assert.equal(isChannelTable([{ stable: 1 }]), false);
    assert.equal(isChannelTable("/lien"), false);
    assert.equal(isChannelTable(null), false);
  });

  it("valeur simple : identique pour tous les canaux", () => {
    assert.equal(pickChannel("/e.json", "beta"), "/e.json");
    const list = [{ name: "a" }];
    assert.equal(pickChannel(list, "alpha"), list);
    assert.equal(pickChannel(undefined, "stable"), undefined);
  });

  it("canal exact, sinon default, sinon stable, sinon rien", () => {
    const table = { stable: "/s", beta: "/b" };
    assert.equal(pickChannel(table, "beta"), "/b");
    assert.equal(pickChannel(table, "alpha"), "/s");
    assert.equal(pickChannel({ beta: "/b", default: "/d", stable: "/s" }, "alpha"), "/d");
    assert.equal(pickChannel({ beta: "/b" }, "stable"), undefined);
  });
});
