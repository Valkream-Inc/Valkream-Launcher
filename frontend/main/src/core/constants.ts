/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Constantes du launcher (main) : mode dev, URL du backend, package.json,
 * en-têtes anti-cache des requêtes HTTP.
 */

import type { NoCacheConfig, PackageJson } from "../types/core";

export const isDev = process.env.NODE_ENV === "dev";

export const baseUrl = isDev ? "http://localhost:3000" : "https://play.valkream.com";

// eslint-disable-next-line @typescript-eslint/no-require-imports
export const pkg = require("../../../package.json") as PackageJson;

export const noCache: NoCacheConfig = {
  headers: {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
  params: {
    // Ajoute un paramètre unique à l'URL : ?_t=1734687219
    _t: Date.now(),
  },
};
