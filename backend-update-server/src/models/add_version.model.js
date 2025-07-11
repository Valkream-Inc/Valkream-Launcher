const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");
const yaml = require("yaml");
const { unZip, formatBytes } = require("valkream-function-lib");

const { ServerError } = require("../components/error.component.js");
const Models = require("../components/models.component.js");

class AddVersion extends Models {
  constructor(props) {
    super();
    this.zip_path = props.zip_path;
    this.latest_dir = props.latest_dir;
    this.old_dir = props.old_dir;
    this.extract_dir = props.extract_dir;
  }

  static async init(props, onProgress) {
    const zipPath = props.zip_path;
    const extractDir = props.extract_dir;
    const latestDir = props.latest_dir;
    const oldDir = props.old_dir;
    const callback = (processedBytes, totalBytes, percent, speed) => {
      if (onProgress)
        onProgress(
          `Extraction en cours : ${percent}% (${formatBytes(
            processedBytes
          )}/${formatBytes(totalBytes)}) à ${formatBytes(speed)}/s`
        );
    };
    try {
      if (onProgress) onProgress("Début de l'extraction...");
      await unZip(zipPath, extractDir, callback);
      if (onProgress)
        onProgress("Extraction terminée, lecture du fichier de version...");
      const versionFile = path.join(latestDir, "latest.yml");
      if (fs.existsSync(versionFile)) {
        const ymlContent = fs.readFileSync(versionFile, "utf8");
        const parsed = yaml.parse(ymlContent);
        const version = parsed.version;
        const archivePath = path.join(oldDir, version);
        if (onProgress) onProgress("Déplacement de l'ancienne version...");
        await fse.move(latestDir, archivePath, { overwrite: true });
      }
      if (onProgress)
        onProgress("Création du dossier de version la plus récente...");
      fs.mkdirSync(latestDir, { recursive: true });
      if (onProgress) onProgress("Copie des fichiers extraits...");
      await fse.copy(extractDir, latestDir, { overwrite: true });
      if (onProgress) onProgress("Nettoyage...");
      if (fs.existsSync(extractDir))
        fs.rmSync(extractDir, { recursive: true, force: true });
      if (onProgress) onProgress("Suppression du fichier zip...");
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      if (onProgress) onProgress("Terminé !");
      return { msg: "✅ Mise à jour installée avec succès." };
    } catch (err) {
      throw new ServerError(err, undefined, "Add version");
    }
  }
}

module.exports = AddVersion;
