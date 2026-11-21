/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Traduction de l'interface (i18next + react-i18next). Langue : réglage `language`
 * (défaut : langue du système, français sinon anglais).
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en";
import fr from "./fr";

export type Language = "fr" | "en";
export const LANGUAGES: Language[] = ["fr", "en"];

export const languageOf = (value: unknown): Language =>
  value === "fr" || value === "en" ? value : typeof navigator !== "undefined" && navigator.language?.startsWith("fr") ? "fr" : "en";

/** À appeler avant le premier rendu. */
export const initI18n = async (): Promise<void> => {
  let saved: unknown;
  try {
    saved = await window.electron_API?.getSettings("language");
  } catch {
    saved = undefined;
  }
  await i18n.use(initReactI18next).init({
    resources: { fr: { translation: fr }, en: { translation: en } },
    lng: languageOf(saved),
    fallbackLng: "fr",
    interpolation: { escapeValue: false }, // React échappe déjà
  });
};

/** Change la langue et l'enregistre. */
export const setLanguage = async (language: Language): Promise<void> => {
  await i18n.changeLanguage(language);
  await window.electron_API.setSettings("language", language);
};

export default i18n;
