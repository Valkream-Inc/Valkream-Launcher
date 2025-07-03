const fs = require("fs");
const path = require("path");

const packageJson = require("../package.json");
// Détection du mode dev via argument ou variable d'environnement
const isDevArg = process.argv.includes("--dev");
const dev = isDevArg || process.env.NODE_ENV === "dev";
const baseUrl = dev ? packageJson.url.baseUrlDev : packageJson.url.baseUrl;
const { apiKey, apiToken } = require("./secured");

const { zipFolder, sendZip } = require("valkream-function-lib");

class Post {
  async init() {
    const distFolder = "./dist";
    const folderToZip = `${distFolder}/toZip`;
    const zipFilePath = "./launcher-build.zip";
    const uploadUrl = `${baseUrl}/launcher/latest/`;

    if (!fs.existsSync(distFolder)) {
      console.log("❌ Le dossier de build n'existe pas !");
      return;
    }

    if (fs.existsSync(folderToZip)) {
      fs.rmSync(folderToZip, { recursive: true });
    }
    fs.mkdirSync(folderToZip, { recursive: true });

    const srcExe = `${distFolder}/Valkream-Launcher-win-x64.exe`;
    const srcBlockmap = `${distFolder}/Valkream-Launcher-win-x64.exe.blockmap`;
    const srcYml = `${distFolder}/latest.yml`;

    const requiredFiles = [srcExe, srcBlockmap, srcYml];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Fichier manquant : ${file}`);
      } else {
        fs.copyFileSync(file, `${folderToZip}/${path.basename(file)}`);
      }
    }

    await zipFolder(folderToZip, zipFilePath);
    await sendZip(zipFilePath, uploadUrl, apiKey, apiToken);

    if (fs.existsSync(distFolder)) {
      fs.rmSync(distFolder, { recursive: true });
      console.log("\n✅ Dossier de build supprimé !");
    }
  }
}

new Post().init();
