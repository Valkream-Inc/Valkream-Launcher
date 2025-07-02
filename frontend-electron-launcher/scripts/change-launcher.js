const yaml = require("yaml");
const axios = require("axios");

const { consoleQuestion, config } = require("@valkream/shared");
const { baseUrl } = config;
const { apiKey, apiToken } = require("../../secured_config.js");

class ChangeLauncher {
  async init() {
    console.log("▶️  Lancement du changement de version du launcher:");
    const versions = await this.getVersions();
    if (versions) {
      await this.changeLauncher(versions);
    }
  }

  async getVersions() {
    try {
      const response = await axios.get(`${baseUrl}/launcher/old/`);
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
      console.error("❌ Erreur lors de la récupération des versions :", err);
      return [];
    }
  }

  async getLatestVersion() {
    try {
      const res = await axios.get(`${baseUrl}/launcher/latest/latest.yml`);
      const parsedData = yaml.parse(res.data);
      return parsedData.version;
    } catch (err) {
      console.error("❌ Erreur lors de la récupération de la version :", err);
    }
  }

  async changeLauncher(versions) {
    console.log("Version disponible :", versions);
    const version = await consoleQuestion(
      `Entrez la version à modifier (latest: ${await this.getLatestVersion()}):`
    );
    if (!version.match(/^\d+\.\d+\.\d+$/)) {
      console.error("❌ Version invalide. Utilisez le format X.Y.Z");
      return;
    }
    if (version === (await this.getLatestVersion())) {
      console.log("❌ La version est déjà séléctionnée !");
      return;
    }
    if (!versions.includes(version)) {
      console.log(`❌ La version ${version} n'est pas disponible !`);
      return;
    }

    try {
      await axios.post(
        `${baseUrl}/launcher/change/`,
        { version, api_key: apiKey, api_token: apiToken },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("✅ Version modifiée avec succès !");
    } catch (err) {
      console.error("❌ Erreur lors de la modification de la version :", err);
    }
  }
}

new ChangeLauncher().init();
