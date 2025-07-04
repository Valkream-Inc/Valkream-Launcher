const axios = require("axios");
const fs = require("fs");
const path = require("path");
const yaml = require("yaml");

const {
  consoleQuestion,
  zipFolder,
  hashFolder,
  cleanGameFolder,
} = require("valkream-function-lib");

const packageJson = require("../package.json");
const dev = process.env.NODE_ENV === "dev";

let baseUrl = "";
let versionArg = null;

if (process.argv.includes("--custom")) {
  const customIndex = process.argv.indexOf("--custom");
  baseUrl = process.argv[customIndex + 1];
  versionArg = process.argv[customIndex + 2];
} else {
  baseUrl = dev ? packageJson.url.baseUrlDev : packageJson.url.baseUrl;
}

class BuildGame {
  async init() {
    try {
      // PART 0 : Create a the bases folders if they don't exist
      const basePath = path.join(__dirname, "../");
      if (!fs.existsSync(basePath)) {
        fs.mkdirSync(basePath, { recursive: true });
        console.log("✅ Dossier créé avec succès !");
        return;
      }

      const ValheimValkreamData = path.join(
        basePath,
        "./Valheim Valkream Data"
      );
      if (!fs.existsSync(ValheimValkreamData)) {
        console.log("❌ Veuillez copier le dossier de configuration du jeu !");
        return;
      }

      // PART 1 : Get a valid version
      let remoteVersion = "0.0.0";
      try {
        const latestYamlUrl = `${baseUrl}/game/latest/latest.yml`;
        const { data } = await axios.get(latestYamlUrl);
        const parsedData = yaml.parse(data);
        if (parsedData?.version) {
          remoteVersion = parsedData.version;
        }
      } catch (err) {
        console.warn("⚠️ Impossible de récupérer la version en ligne.");
      }
      const version =
        versionArg ||
        (await consoleQuestion(
          `Entrez la version à packager (latest: ${remoteVersion}):`
        ));
      if (!version.match(/^\d+\.\d+\.\d+$/)) {
        console.error("❌ Version invalide. Utilisez le format X.Y.Z");
        return;
      }
      if (!this.isNewerVersion(version, remoteVersion)) {
        console.log(
          "❌ La version locale n'est pas plus récente que celle en ligne :",
          remoteVersion
        );
        return;
      }

      // PART 2 : Get the folders to zip
      const configFolderToZip = path.join(
        ValheimValkreamData,
        "./BepInEx/config"
      );
      const pluginsFolderToZip = path.join(
        ValheimValkreamData,
        "./BepInEx/plugins"
      );

      const buildDir = path.join(basePath, "build");
      if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir);

      const ValheimValkreamDataZipFilePath = path.join(buildDir, "./game.zip");
      const configFilePath = path.join(buildDir, "./game-config.zip");
      const pluginsFilePath = path.join(buildDir, "./game-plugins.zip");

      // PART 3 : Zip the folders
      await zipFolder(ValheimValkreamData, ValheimValkreamDataZipFilePath);
      await zipFolder(configFolderToZip, configFilePath);
      await zipFolder(pluginsFolderToZip, pluginsFilePath);

      // PART 4 : Hash the folders
      cleanGameFolder(ValheimValkreamData, packageJson.GameFoldersToClean);

      const configHash = await hashFolder(configFolderToZip);
      const pluginsHash = await hashFolder(pluginsFolderToZip);

      // PART 5 : Create the latest.yaml file
      const localLatest = {
        version,
        buildDate: new Date().toISOString(),
        hash: { config: configHash, plugins: pluginsHash },
      };
      fs.writeFileSync(
        path.join(buildDir, "latest.yml"),
        yaml.stringify(localLatest)
      );

      // PART 6 : Zip the build folder
      const uploadZipPath = path.join(basePath, "./game-build.zip");
      await zipFolder(buildDir, uploadZipPath);

      console.log("✅ Fichier compressé avec succès !");
    } catch (err) {
      console.error("❌ Erreur lors de la compression du jeu :", err);
    }
  }

  isNewerVersion(local, remote) {
    const l = local.split(".").map(Number);
    const r = remote.split(".").map(Number);
    for (let i = 0; i < 3; i++) {
      if ((l[i] ?? 0) > (r[i] ?? 0)) return true;
      if ((l[i] ?? 0) < (r[i] ?? 0)) return false;
    }
    return false;
  }
}

new BuildGame().init();
