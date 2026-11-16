/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { NoCacheConfig } from "../types/core";

const noCache: NoCacheConfig = {
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

export default noCache;
