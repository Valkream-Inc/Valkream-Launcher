const path = require("path");
const fs = require("fs");

const { ClientError } = require("../components/error.component.js");
const Models = require("../components/models.component.js");

class ServeFile extends Models {
  constructor(props) {
    super(props);
    this.baseDir = props.baseDir;
    this.filename = props.filename;
  }

  static getFilePath(props) {
    const { baseDir, filename, user } = props;
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\") ||
      path.basename(filename) !== filename
    ) {
      throw new ClientError("Fichier non autorisé", 400, user, "serve_file");
    }
    const filePath = path.join(baseDir, filename);
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      throw new ClientError("Fichier introuvable", 404, user, "serve_file");
    }
    return filePath;
  }
}

module.exports = ServeFile;
