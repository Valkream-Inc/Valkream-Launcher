const axios = require("axios");

const { consoleQuestion, config } = require("@valkream/shared");
const { baseUrl } = config;
const { apiKey, apiToken } = require("../../secured_config.js");

class ChangeEventTools {
  static isValidISODate(dateStr) {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/;
    if (!isoDateRegex.test(dateStr)) return false;
    const d = new Date(dateStr);
    return d instanceof Date && !isNaN(d);
  }

  static formatLocalDate(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds()
    )}`;
  }

  static truncate(str, max = 60) {
    return typeof str === "string" && str.length > max
      ? str.slice(0, max - 3) + "..."
      : str;
  }

  static async question(question) {
    return await consoleQuestion(question);
  }
}

class ChangeEvent {
  async init() {
    console.log("▶️  Lancement de la récupération de l'évènement:");
    const actualEvent = await this.getActualEvent();
    if (actualEvent) await this.changeEvent(actualEvent);
    else console.log("❌ Aucun évènement trouvé.");
  }

  async getActualEvent() {
    try {
      return (await axios.get(`${baseUrl}/config/event.json`)).data;
    } catch (err) {
      console.error("❌ Erreur lors de la récupération de l'évènement :", err);
      return null;
    }
  }

  async changeEvent(actualEvent) {
    const Tools = ChangeEventTools;

    const displayedEvent = {
      ...actualEvent,
      description: Tools.truncate(actualEvent.description ?? "", 100),
      image: Tools.truncate(actualEvent.image ?? "", 60),
      link: Tools.truncate(actualEvent.link ?? "", 60),
      date: Tools.formatLocalDate(new Date(actualEvent.date)),
    };
    console.log("🟡 Évènement actuel :", displayedEvent);

    // name
    const nameInput = (
      await Tools.question(`Entrez le nom de l'évènement:`)
    ).trim();
    const name = nameInput || actualEvent.name;

    // enabled
    let enabledRaw = (
      await Tools.question(`Activer l'évènement ? (true/false):`)
    ).trim();
    const enabled =
      enabledRaw === ""
        ? actualEvent.enabled
        : enabledRaw.toLowerCase() === "true";

    // date
    let dateStr = (
      await Tools.question(
        `Entrez la date de l'évènement (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss) [${Tools.formatLocalDate(
          new Date(actualEvent.date)
        )}]:`
      )
    ).trim();

    while (dateStr !== "" && !Tools.isValidISODate(dateStr)) {
      console.log(
        "❌ Format invalide. Exemple : 2025-07-02 ou 2025-07-02T14:30:00"
      );
      dateStr = (
        await Tools.question("Entrez la date de l'évènement :")
      ).trim();
    }

    const dateLocal =
      dateStr === ""
        ? new Date(actualEvent.date)
        : new Date(dateStr.length === 10 ? dateStr + "T00:00:00" : dateStr);

    const dateISO = dateLocal.toISOString();

    // description
    const descriptionInput = (
      await Tools.question(`Entrez la description de l'évènement:`)
    ).trim();
    const description = descriptionInput || actualEvent.description;

    // image
    const imageInput = (
      await Tools.question(`Entrez l'URL de l'image:`)
    ).trim();
    const image = imageInput || actualEvent.image;

    // link
    const linkInput = (await Tools.question(`Entrez l'URL du lien:`)).trim();
    const link = linkInput || actualEvent.link;

    // axios post
    try {
      await axios.post(
        `${baseUrl}/config/change-event/`,
        {
          api_key: apiKey,
          api_token: apiToken,
          event: {
            name,
            enabled,
            date: dateISO,
            description,
            image: image || null,
            link: link || null,
          },
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log("✅ Évènement modifié avec succès !");
    } catch (err) {
      console.error("❌ Erreur lors de la modification de l'évènement :", err);
    }
  }
}

new ChangeEvent().init();
