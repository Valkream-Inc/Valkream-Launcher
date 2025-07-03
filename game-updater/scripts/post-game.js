const fs = require("fs");
const path = require("path");

const packageJson = require("../package.json");
const isDevArg = process.argv.includes("--dev");
const dev = isDevArg || process.env.NODE_ENV === "dev";
const baseUrl = dev ? packageJson.url.baseUrlDev : packageJson.url.baseUrl;
const { apiKey, apiToken } = packageJson.api;

const { sendZip } = require("valkream-function-lib");

class PostGame {
  async init() {
    try {
      const basePath = path.join(__dirname, "../");

      const uploadZipPath = path.join(basePath, "./game-build.zip");
      if (!fs.existsSync(uploadZipPath)) {
        console.error("❌ Fichier de build introuvable !");
        return;
      }

      const uploadUrl = `${baseUrl}/game/latest/`;
      await sendZip(uploadZipPath, uploadUrl, apiKey, apiToken);
      console.log("\n✅ Fichier envoyé avec succès !");

      const buildDir = path.join(basePath, "build");
      if (fs.existsSync(buildDir)) {
        fs.rmSync(buildDir, { recursive: true });
        console.log("✅ Dossier build supprimé avec succès !");
      }
    } catch (err) {
      console.error("❌ Erreur lors de l'envoi du jeu :", err);
    }
  }
}

new PostGame().init();
