/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Erreur dont le texte est traduisible : clé `err.*` (ou autre clé de `messages.ts`) + variables.
 * `message` suit la langue courante (`setErrorLanguage`, français par défaut : tests) ; `errorText` donne le texte dans la langue voulue
 * et `errorTexts` les deux langues (le journal les garde pour suivre le changement de langue).
 */

import { type Lang, type MessageKey, MESSAGE_LANGS, translate } from "./messages.js";

export type ErrorVars = Record<string, string | number>;

/** Langue des `message` : « fr » par défaut, branchée sur le réglage de langue au démarrage (`app.ts`). */
let currentLanguage: () => Lang = () => "fr";
/** Langue courante (celle du joueur) : sert aussi à choisir la variante par langue des fichiers de config. */
export const getErrorLanguage = (): Lang => currentLanguage();
export const setErrorLanguage = (provider: () => Lang): void => {
  currentLanguage = provider;
};

export class LocalizedError extends Error {
  constructor(
    readonly key: MessageKey,
    readonly vars: ErrorVars = {},
  ) {
    super(translate(currentLanguage(), key, vars));
    this.name = "LocalizedError";
  }
}

/** Texte de l'erreur dans la langue `lang` (message brut pour une erreur non traduisible). */
export const errorText = (error: unknown, lang: Lang): string =>
  error instanceof LocalizedError ? translate(lang, error.key, error.vars) : error instanceof Error ? error.message : String(error);

export const errorTexts = (error: unknown): Record<Lang, string> => ({
  fr: errorText(error, "fr"),
  en: errorText(error, "en"),
});

export const LANGS = Object.keys(MESSAGE_LANGS) as Lang[];
