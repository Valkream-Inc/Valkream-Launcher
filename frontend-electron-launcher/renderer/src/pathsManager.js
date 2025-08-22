/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const path = require("path");

class PathsManager {
  constructor() {
    // __dirname pointe sur le dossier contenant ce fichier, même dans l'asar
    this.srcDir = path.resolve(__dirname, "../");
  }

  getSrcPath(...segments) {
    return path.join(this.srcDir, ...segments);
  }

  getRendererPath(...segments) {
    return this.getSrcPath("renderer", ...segments);
  }

  getAssetsPath(...segments) {
    return this.getSrcPath("assets", ...segments);
  }

  getUtils() {
    return this.getRendererPath("utils", "index.js");
  }
}

module.exports = new PathsManager();
