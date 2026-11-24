/**
 * @author Valkream Team
 * @license MIT-NC
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isQrLine, qrModules } from "./qr-block.js";

describe("QR code en demi-blocs", () => {
  it("reconnaît les lignes de blocs et pas le reste", () => {
    assert.equal(isQrLine("█▀▀▀█ ▄▄ █▀▀▀█ ▀"), true);
    assert.equal(isQrLine("   "), false);
    assert.equal(isQrLine("12.50% file.pak"), false);
    assert.equal(isQrLine("▀▄█ �"), false); // caractère de remplacement : pas un QR lisible
  });

  it("convertit chaque caractère en deux modules", () => {
    const line = "█▀▄ ".padEnd(16, " ");
    const grid = qrModules([line, line, line, line, line]);
    assert.ok(grid);
    assert.equal(grid.length, 10);
    assert.deepEqual(grid[0].slice(0, 4), [true, true, false, false]); // haut : █ ▀ ▄ ' '
    assert.deepEqual(grid[1].slice(0, 4), [true, false, true, false]); // bas
  });

  it("refuse un bloc trop petit", () => {
    assert.equal(qrModules(["█▀", "▄ "]), null);
  });
});
