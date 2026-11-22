/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Choix du texte dans une valeur `LocalizedText` (chaîne seule, ou une chaîne par langue).
 * Module pur (sans i18next) : testable sans l'interface.
 */

import type { LocalizedText } from "@shared/types";

export const pickText = (value: LocalizedText | undefined, language: "fr" | "en"): string | undefined => {
  if (value === undefined || typeof value === "string") return value;
  return value[language] ?? value.fr ?? value.en;
};
