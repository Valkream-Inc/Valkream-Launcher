/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createGlobalProgress } from "./global-progress.js";
import type { TransferProgress } from "./types.js";

describe("createGlobalProgress", () => {
  it("un pourcentage global sur plusieurs unités en parallèle", () => {
    const seen: TransferProgress[] = [];
    const progress = createGlobalProgress((p) => seen.push(p), () => 4);
    progress.skip(); // 25 %
    progress.update("a", 0.5, 100); // 25 + 12,5
    progress.update("b", 0.5, 100); // 25 + 25
    assert.equal(seen.at(-1)?.percent, 50);
    progress.finish("a", 200);
    progress.finish("b", 200);
    progress.finish("c");
    progress.finish("d");
    assert.equal(seen.at(-1)?.percent, 100);
    assert.equal(seen.at(-1)?.processed, 400);
  });

  it("le pourcentage ne recule pas quand le total grandit", () => {
    let total = 2;
    const seen: number[] = [];
    const progress = createGlobalProgress((p) => seen.push(p.percent), () => total);
    progress.finish("a");
    total = 4;
    progress.update("b", 0, 0);
    assert.deepEqual(seen, [50, 50]);
  });
});

describe("createGlobalProgress : pondéré par les octets", () => {
  it("un gros fichier pèse plus que les petits, le total est affiché", () => {
    const seen: TransferProgress[] = [];
    const progress = createGlobalProgress((p) => seen.push(p), () => 2);
    progress.expect("gros", 900);
    progress.expect("petit", 100);
    progress.update("gros", 0.5, 450);
    progress.update("petit", 0, 0);
    // 450 / 1000 octets = 45 % (et non 25 % par fichier)
    assert.equal(seen.at(-1)?.percent, 45);
    assert.equal(seen.at(-1)?.total, 1000);
    assert.doesNotMatch(seen.at(-1)?.totalBytes ?? "", /^~/);
    progress.finish("gros", 900);
    progress.finish("petit", 100);
    assert.equal(seen.at(-1)?.percent, 100);
  });

  it("tailles partielles : estimation à la moyenne, total précédé de ~", () => {
    const seen: TransferProgress[] = [];
    const progress = createGlobalProgress((p) => seen.push(p), () => 4);
    progress.expect("a", 100);
    progress.update("a", 1, 100);
    assert.match(seen.at(-1)?.totalBytes ?? "", /^~/);
    assert.equal(seen.at(-1)?.total, 400); // 4 unités estimées à 100 octets
    assert.equal(seen.at(-1)?.percent, 25);
  });

  it("sans aucune taille : pourcentage par unité, pas de total", () => {
    const seen: TransferProgress[] = [];
    const progress = createGlobalProgress((p) => seen.push(p), () => 2);
    progress.skip();
    assert.equal(seen.at(-1)?.percent, 50);
    assert.equal(seen.at(-1)?.totalBytes, "");
    assert.equal(seen.at(-1)?.total, undefined);
  });
});

it("lock : le total ne change plus quand une taille arrive en retard", () => {
  const reports: { total?: number }[] = [];
  const progress = createGlobalProgress((t) => reports.push(t), () => 3);
  progress.expect("a", 100);
  progress.expect("b", 100);
  progress.lock(); // « c » inconnu : estimé à 100
  progress.update("c", 0.5, 10);
  const before = reports.at(-1)?.total;
  progress.expect("c", 5000);
  progress.update("c", 0.6, 20);
  assert.equal(reports.at(-1)?.total, before);
  progress.finish("c", 20);
  assert.equal(reports.at(-1)?.total, before);
});
