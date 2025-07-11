const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");
const yaml = require("yaml");

const { unZip } = require("valkream-function-lib");

const { ServerError } = require("../compoment/error.compoment");
const paths = require("../config/paths.config");

const AddVersion = function (props) {
  this.zip_path = props.zip_path;
  this.latest_dir = props.latest_dir;
  this.old_dir = props.old_dir;
  this.extract_dir = props.extract_dir;
  this.user = props.user;
};

AddVersion.init = async (props) => {
  const zipPath = props.zip_path;
  const extractDir = props.extract_dir;
  const latestDir = props.latest_dir;
  const oldDir = props.old_dir;

  try {
    await unZip(zipPath, extractDir);

    const versionFile = path.join(latestDir, "latest.yml");
    if (fs.existsSync(versionFile)) {
      const ymlContent = fs.readFileSync(versionFile, "utf8");
      const parsed = yaml.parse(ymlContent);
      const version = parsed.version;
      const archivePath = path.join(oldDir, version);

      await fse.move(latestDir, archivePath, { overwrite: true });
    }

    fs.mkdirSync(latestDir, { recursive: true });
    await fse.copy(extractDir, latestDir, { overwrite: true });

    // Nettoyage
    fs.rmSync(extractDir, { recursive: true, force: true });
    fs.unlinkSync(zipPath);

    return { msg: "✅ Mise à jour installée avec succès." };
  } catch (err) {
    throw new ServerError(err, props.user, "Add version");
  }
};

module.exports = AddVersion;
