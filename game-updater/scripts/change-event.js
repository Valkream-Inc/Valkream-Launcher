const axios = require("axios");

const { consoleQuestion, config } = require("@valkream/shared");
const { baseUrl } = config;
const { apiKey, apiToken } = require("../../secured_config.js");

class ChangeEvent {
  async init() {
    console.log("▶️  Lancement de la recuperation de l'évènement:");
    const actualEvent = await this.getActualEvent();
    if (actualEvent) {
      await this.changeEvent(actualEvent);
    }
  }

  async getActualEvent() {
    try {
      const res = await axios.get(`${baseUrl}/config/event.json`);
      return res.data;
    } catch (err) {
      console.error("❌ Erreur lors de la récupération de l'évènement :", err);
      return null;
    }
  }

  async changeEvent(actualEvent) {
    console.log("event actuel :", actualEvent);

    const name = await consoleQuestion("Entrez le nom de l'évènement:");

    let enabledRaw = await consoleQuestion(
      "Activer l'évènement ? (true/false):"
    );
    const enabled = enabledRaw.toLowerCase() === "true";

    // Validation stricte ISO date (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss)
    function isValidISODate(dateStr) {
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/;
      if (!isoDateRegex.test(dateStr)) return false;
      const d = new Date(dateStr);
      return d instanceof Date && !isNaN(d);
    }

    let dateStr = await consoleQuestion(
      "Entrez la date de l'évènement (format YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss, vide pour aujourd'hui) (ex: 2025-07-02 ou 2025-07-02T14:30:00):"
    );

    while (dateStr.trim() !== "" && !isValidISODate(dateStr.trim())) {
      console.log(
        "❌ Date invalide. Veuillez respecter le format YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss"
      );
      dateStr = await consoleQuestion("Entrez la date de l'évènement:");
    }

    const dateISO =
      dateStr.trim() === ""
        ? new Date().toISOString()
        : new Date(dateStr).toISOString();

    const description = await consoleQuestion(
      "Entrez la description de l'évènement:"
    );
    const image = await consoleQuestion(
      "Entrez l'url de l'image de l'évènement ou rien si pas d'image:"
    );
    const link = await consoleQuestion(
      "Entrez l'url du lien de l'évènement ou rien si pas de lien:"
    );

    const event = {
      name,
      enabled,
      date: dateISO,
      description,
      image: image.trim() || null,
      link: link.trim() || null,
    };

    try {
      await axios.post(
        `${baseUrl}/config/change-event/`,
        {
          api_key: apiKey,
          api_token: apiToken,
          event,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log("✅ Évènement modifié avec succès !");
    } catch (err) {
      console.error("❌ Erreur lors de la modification de l'évènement :", err);
      return null;
    }
  }
}

new ChangeEvent().init();
