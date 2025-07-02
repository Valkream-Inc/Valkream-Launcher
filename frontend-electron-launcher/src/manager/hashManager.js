const fs = require("fs");
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");

class HashManager {
  constructor(serverRoot, appDir) {
    this.serverHashedPluginsLink = serverRoot + "ServerHashedFiles.txt";
    this.serverHashedConfigLink = serverRoot + "ServerConfigFiles.txt";
    this.localHashedPluginsLink = path.join(
      appDir,
      "Valheim Valkream Data/BepInEx/plugins/"
    );
    this.localHashedConfigLink = path.join(
      appDir,
      "Valheim Valkream Data/BepInEx/config/"
    );
  }

  async getOnlineHash() {
    try {
      const serverHashedPluginsFile = await axios.get(
        this.serverHashedPluginsLink
      );
      const serverHashedConfigFile = await axios.get(
        this.serverHashedConfigLink
      );
      return {
        plugins: serverHashedPluginsFile.data.trim(),
        config: serverHashedConfigFile.data.trim(),
      };
    } catch (err) {
      console.error(
        "Erreur lors de la récupération du hash du fichier de configuration:",
        err
      );
    }
  }

  async getLocalHash() {
    try {
      const pluginsHash = this.hashDirectory(this.localHashedPluginsLink);
      const configHash = this.hashDirectory(this.localHashedConfigLink);

      return {
        plugins: pluginsHash,
        config: configHash,
      };
    } catch (err) {
      console.error(
        "Erreur lors de la lecture du hash du fichier de configuration:",
        err
      );
    }
  }

  hashDirectory(directoryPath) {
    try {
      if (!fs.existsSync(directoryPath)) {
        console.log("Dossier non trouvé:", directoryPath);
      }

      const files = this.getAllFiles(directoryPath);
      if (files.length === 0) {
        console.log("Aucun fichier trouvé dans:", directoryPath);
      }

      // Trier les fichiers pour avoir un hash cohérent
      files.sort();

      const hash = crypto.createHash("md5");

      for (const file of files) {
        try {
          const content = fs.readFileSync(file);
          const relativePath = path.relative(directoryPath, file);
          hash.update(relativePath);
          hash.update(content);
        } catch (err) {
          console.error("Erreur lors de la lecture du fichier:", file, err);
        }
      }

      const result = hash.digest("hex");
      console.log(`Hash du dossier ${directoryPath}:`, result);
      return result;
    } catch (err) {
      console.error("Erreur lors du hash du dossier:", directoryPath, err);
    }
  }

  getAllFiles(dirPath, arrayOfFiles = []) {
    try {
      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        const fullPath = path.join(dirPath, file);

        if (fs.statSync(fullPath).isDirectory()) {
          arrayOfFiles = this.getAllFiles(fullPath, arrayOfFiles);
        } else {
          arrayOfFiles.push(fullPath);
        }
      }
    } catch (err) {
      console.error("Erreur lors de la lecture du dossier:", dirPath, err);
    }

    return arrayOfFiles;
  }
}

module.exports = {
  HashManager,
};
