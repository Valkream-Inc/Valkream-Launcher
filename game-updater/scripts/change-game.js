const yaml = require("yaml");
const axios = require("axios");

const packageJson = require("../package.json");
const isDevArg = process.argv.includes("--dev");
const dev = isDevArg || process.env.NODE_ENV === "dev";
const baseUrl = dev ? packageJson.url.baseUrlDev : packageJson.url.baseUrl;
const { apiKey, apiToken } = packageJson.api;

const { consoleQuestion } = require("valkream-function-lib");

class ChangeGame {
  async init() {
    console.log("▶️  Lancement du changement de version du jeu:");
    const versions = await this.getVersions();
    if (versions) {
      await this.changeGame(versions);
    }
  }

  async getVersions() {
    try {
      const response = await axios.get(`${baseUrl}/game/old/`);
      const versions = response.data;

      versions.sort((a, b) => {
        const aParts = a.split(".").map(Number);
        const bParts = b.split(".").map(Number);

        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          const aNum = aParts[i] || 0;
          const bNum = bParts[i] || 0;

          if (aNum < bNum) return -1;
          if (aNum > bNum) return 1;
        }
        return 0;
      });

      return versions;
    } catch (err) {
      console.error(
        "❌ Erreur lors de la récupération des versions du jeu :",
        err
      );
      return [];
    }
  }

  async getLatestVersion() {
    try {
      const res = await axios.get(`${baseUrl}/game/latest/latest.yml`);
      const parsedData = yaml.parse(res.data);
      return parsedData.version;
    } catch (err) {
      console.error(
        "❌ Erreur lors de la récupération de la dernière version du jeu :",
        err
      );
      return null;
    }
  }

  async changeGame(versions) {
    console.log("Versions disponibles :", versions);
    const version = await consoleQuestion(
      `Entrez la version du jeu à activer (latest: ${await this.getLatestVersion()}):`
    );
    if (!version.match(/^\d+\.\d+\.\d+$/)) {
      console.error("❌ Version invalide. Utilisez le format X.Y.Z");
      return;
    }
    if (version === (await this.getLatestVersion())) {
      console.log("❌ La version est déjà sélectionnée !");
      return;
    }
    if (!versions.includes(version)) {
      console.log(`❌ La version ${version} n'est pas disponible !`);
      return;
    }

    try {
      await axios.post(
        `${baseUrl}/game/change/`,
        { version, api_key: apiKey, api_token: apiToken },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("✅ Version du jeu modifiée avec succès !");
    } catch (err) {
      console.error(
        "❌ Erreur lors de la modification de la version du jeu :",
        err
      );
    }
  }
}

new ChangeGame().init();
