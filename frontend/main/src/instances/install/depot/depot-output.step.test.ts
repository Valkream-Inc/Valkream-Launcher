/**
 * @author Valkream Team
 * @license MIT-NC
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { advanceDepotStep, parseDepotStep } from "./depot-output.js";

describe("étapes DepotDownloader", () => {
  it("analyse avant téléchargement : seul un pourcentage est un téléchargement", () => {
    assert.equal(parseDepotStep("Got depot key for 892971 result: OK"), "scan");
    assert.equal(parseDepotStep("Validating files"), "scan");
    assert.equal(parseDepotStep(" 12.34% game/valheim.exe"), "download");
  });

  it("l'étape n'avance que vers l'avant", () => {
    assert.equal(advanceDepotStep("scan", "download"), "download");
    assert.equal(advanceDepotStep("download", "scan"), undefined);
    assert.equal(advanceDepotStep("download", "download"), undefined);
    assert.equal(advanceDepotStep(undefined, "login"), "login");
  });
});
