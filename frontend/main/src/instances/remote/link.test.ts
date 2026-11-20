import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  classifyLink,
  isFetchableLink,
  isPerPlatformContent,
  resolveLinkUrl,
} from "./link";

describe("classifyLink", () => {
  it("reconnaît URL, relatif et data", () => {
    assert.equal(classifyLink("https://thunderstore.io/x"), "url");
    assert.equal(classifyLink("http://localhost:3000/x"), "url");
    assert.equal(classifyLink("/games/Valheim/latest.yml"), "relative");
    assert.equal(classifyLink("data:image/png;base64,AAAA"), "data");
  });

  it("refuse ce qui n'est pas un lien (exemples)", () => {
    for (const bad of ["htpp://something", "binary", "relative/sans/slash", "//hote/x", "", "https://"]) {
      assert.equal(classifyLink(bad), "invalid", bad);
    }
  });
});

describe("isFetchableLink", () => {
  it("n'accepte que URL et relatif", () => {
    assert.equal(isFetchableLink("/a"), true);
    assert.equal(isFetchableLink("https://a.b"), true);
    assert.equal(isFetchableLink("data:text/plain,x"), false);
    assert.equal(isFetchableLink(undefined), false);
    assert.equal(isFetchableLink({}), false);
  });
});

describe("resolveLinkUrl", () => {
  it("laisse une URL telle quelle", () => {
    assert.equal(resolveLinkUrl("https://a.b/c", "https://base"), "https://a.b/c");
  });

  it("préfixe un lien relatif par la base, sans double slash", () => {
    assert.equal(resolveLinkUrl("/games/x.yml", "https://base"), "https://base/games/x.yml");
    assert.equal(resolveLinkUrl("/games/x.yml", "https://base/"), "https://base/games/x.yml");
  });

  it("refuse « .. », data et lien invalide", () => {
    assert.throws(() => resolveLinkUrl("/a/../b", "https://base"), /\.\./);
    assert.throws(() => resolveLinkUrl("data:text/plain,x", "https://base"), /data:/);
    assert.throws(() => resolveLinkUrl("binary", "https://base"), /invalide/);
  });
});

describe("contenu par plateforme", () => {
  it("distingue table par plateforme et manifeste inline", () => {
    assert.equal(isPerPlatformContent({ win32: "/a", linux: "/b" }), true);
    assert.equal(isPerPlatformContent({ default: "/a" }), true);
    assert.equal(isPerPlatformContent({ "/toto/x": "hash" }), false);
    assert.equal(isPerPlatformContent({ win32: "/a", "/toto/x": "hash" }), false);
    assert.equal(isPerPlatformContent("/a"), false);
    assert.equal(isPerPlatformContent(["a-b-1"]), false);
    assert.equal(isPerPlatformContent({}), false);
  });
});
