const path = require("path");

class PathsManager {
  constructor() {
    // __dirname pointe sur le dossier contenant ce fichier, même dans l'asar
    this.srcDir = path.resolve(__dirname, "../../");
  }

  getAbsolutePath(...segments) {
    return path.join(this.srcDir, "../", ...segments);
  }

  getSrcPath(...segments) {
    return path.join(this.srcDir, ...segments);
  }

  getSharedPath(...segments) {
    return this.getSrcPath("shared", ...segments);
  }

  getRendererPath(...segments) {
    return this.getSrcPath("renderer", ...segments);
  }

  getMainPath(...segments) {
    return this.getSrcPath("main", ...segments);
  }

  getAssetsPath(...segments) {
    return this.getSrcPath("assets", ...segments);
  }

  getUtils() {
    return this.getRendererPath("utils", "utils-render.js");
  }

  getConstants() {
    return this.getSharedPath("constants", "constants.js");
  }

  getSharedUtils() {
    return this.getSharedPath("utils", "shared-utils.js");
  }
}

module.exports = new PathsManager();
