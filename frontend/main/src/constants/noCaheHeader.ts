/**
 * @author Valkream Team
 * @license MIT-NC
 */

const noCache = {
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

module.exports = noCache;
