const fs = require("fs");
const path = require("path");

const { sendZip, config } = require("@valkream/shared");
const { baseUrl } = config;
const { apiKey, apiToken } = require("../../secured_config.js");

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
