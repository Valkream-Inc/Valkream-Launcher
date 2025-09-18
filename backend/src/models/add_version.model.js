const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");
const yaml = require("yaml");

const { unZip } = require("../function/unZip.js");
const { formatBytes } = require("../function/formatBytes.js");

const { ServerError } = require("../components/error.component.js");
const Models = require("../components/models.component.js");

class AddVersion extends Models {
  constructor(props) {
    super(props);
    this.zip_path = props.zip_path;
    this.latest_dir = props.latest_dir;
    this.old_dir = props.old_dir;
    this.extract_dir = props.extract_dir;
  }

  static async init(props, onProgress) {
    const { zip_path, extract_dir, latest_dir, old_dir, user } = props;

    const callback = (processedBytes, totalBytes, percent, speed) => {
      if (onProgress)
        onProgress(
          `Extraction en cours : ${percent}% (${formatBytes(
            processedBytes
          )}/${formatBytes(totalBytes)}) à ${formatBytes(speed)}/s`
        );
    };

    try {
      await unZip(zip_path, extract_dir, callback);

      const versionFile = path.join(latest_dir, "latest.yml");
      if (fs.existsSync(versionFile)) {
        const ymlContent = fs.readFileSync(versionFile, "utf8");
        const parsed = yaml.parse(ymlContent);
        const version = parsed.version;
        const archivePath = path.join(old_dir, version);

        // More robust directory moving with retry logic
        try {
          // First try to copy then remove
          if (fs.existsSync(archivePath)) {
            await fse.remove(archivePath);
          }
          await fse.copy(latest_dir, archivePath);
          await fse.remove(latest_dir);
        } catch (moveError) {
          // If move fails, try alternative approach
          console.warn(`Failed to move directory: ${moveError.message}`);
          // Create a temporary directory and copy there
          const tempPath = path.join(old_dir, `${version}_temp_${Date.now()}`);
          await fse.copy(latest_dir, tempPath);
          await fse.remove(latest_dir);
          // Rename temp to final name
          await fse.move(tempPath, archivePath);
        }
      }

      fs.mkdirSync(latest_dir, { recursive: true });
      if (onProgress) onProgress("Copie des fichiers extraits...");
      await fse.copy(extract_dir, latest_dir, { overwrite: true });

      // Nettoyage
      if (fs.existsSync(extract_dir))
        fs.rmSync(extract_dir, { recursive: true, force: true });
      if (fs.existsSync(zip_path)) fs.unlinkSync(zip_path);

      return { msg: "✅ Mise à jour installée avec succès." };
    } catch (err) {
      throw new ServerError(err.message || err, user, "Add version");
    }
  }
}

module.exports = AddVersion;
