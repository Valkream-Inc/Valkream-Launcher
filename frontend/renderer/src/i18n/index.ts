/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Traduction de l'interface (i18next + react-i18next). Langue : réglage `language`
 * (défaut : langue du système, français sinon anglais).
 */

import type { LocalizedText } from "@shared/types";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en";
import { pickText } from "./localized";
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

/** Texte d'une config remote : chaîne seule, ou `{ fr, en }` (langue courante, repli sur fr puis en). */
export const localized = (value: LocalizedText | undefined): string | undefined =>
  pickText(value, languageOf(i18n.language));

/** Enregistre les `translations` de chaque instance (clés `instances.<id>.<clé>`). À appeler après `initI18n`. */
export const registerInstanceTranslations = (
  configs: readonly { id: string; translations?: Partial<Record<Language, Record<string, string>>> }[],
): void => {
  for (const config of configs) {
    for (const language of LANGUAGES) {
      for (const [key, text] of Object.entries(config.translations?.[language] ?? {})) {
        i18n.addResource(language, "translation", `instances.${config.id}.${key}`, text);
      }
    }
  }
};

/**
 * Texte d'un jeu : `{ fr, en }` en ligne, clé de `translations` de l'instance, clé globale, ou texte brut.
 * (Dans un composant, appeler `useTranslation()` pour re-rendre au changement de langue.)
 */
export const instanceText = (instanceId: string, value: LocalizedText | undefined): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === "object") return localized(value);
  return i18n.t([`instances.${instanceId}.${value}`, value], { defaultValue: value }) as string;
};

export default i18n;
