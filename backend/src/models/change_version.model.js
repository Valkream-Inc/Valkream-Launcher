const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const yaml = require("yaml");

const { ClientError, ServerError } = require("../components/error.component");
const Models = require("../components/models.component.js");

class ChangeVersion extends Models {
  constructor(props) {
    super(props);
    this.latestDir = props.latestDir;
    this.oldDir = props.oldDir;
    this.requestedVersion = props.requestedVersion;
  }

  static async init(props) {
    const { latestDir, oldDir, requestedVersion, user } = props;
    try {
      if (!fs.readdirSync(oldDir).includes(requestedVersion))
        throw new ClientError("Version invalide", 400, user, "change_version");
      const versionFile = path.join(latestDir, "latest.yml");
      if (!fs.existsSync(versionFile)) {
        throw new ServerError(
          "La latest.yml n'existe pas",
          user,
          "change_version"
        );
      }
      const ymlContent = fs.readFileSync(versionFile, "utf8");
      const parsed = yaml.parse(ymlContent);
      const currentVersion = parsed.version;
      const archivePath = path.join(oldDir, currentVersion);
      await fse.move(latestDir, archivePath, { overwrite: true });
      await fse.move(path.join(oldDir, requestedVersion), latestDir, {
        overwrite: true,
      });
      return { msg: `Version changée avec succès : ${requestedVersion}` };
    } catch (err) {
      throw new ServerError(err, user, "change_version");
    }
  }
}

module.exports = ChangeVersion;
