/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Textes affichés au joueur et produits par le processus main (progression, mise à jour du launcher).
 * Les erreurs de configuration destinées aux administrateurs restent en français.
 */

export type Lang = "fr" | "en";

const MESSAGES = {
  fr: {
    "progress.download": "{{label}} : téléchargement",
    "progress.downloadExtract": "{{label}} : téléchargement + extraction",
    "progress.extract": "{{label}} : extraction",
    "progress.mods": "{{label}} : mods",
    "progress.removed": "{{label}} retiré",
    "progress.cancelled": "annulé",
    "install.alreadyRunning": "Une installation est déjà en cours",
    "log.start": "Synchronisation [{{channel}}]{{mode}} : {{count}} entrée(s)",
    "log.repairMode": " en mode réparation",
    "log.entryStart": "▶ ({{index}}/{{total}}) {{entry}} : {{message}}",
    "log.entryDone": "✔ {{entry}} : terminé",
    "log.entryDoneWith": "✔ {{entry}} : {{message}}",
    "log.entryError": "✖ {{entry}} : {{message}}",
    "log.summary": "Fin de la synchronisation en {{seconds}} s : {{ok}} réussie(s), {{failed}} en échec{{cancelled}}",
    "log.cancelled": ", annulée",
    "update.noServer": "❌ Pas de connexion au serveur. Impossible de vérifier les mises à jour.",
    "update.checkFailed": "❌ Échec de la vérification des mises à jour.",
    "update.checking": "🔍 Vérification des mises à jour...",
    "update.none": "🟢 Aucune mise à jour.",
    "update.available": "🔄 Mise à jour disponible...\n({{from}} --> {{to}})",
    "update.downloadFailed": "❌ Échec du téléchargement de la mise à jour.",
    "update.progress": "📥 {{percent}}% ({{done}} / {{total}})\n à {{speed}}",
    "update.downloaded": "✅ Mise à jour téléchargée. Redémarrage...",
    "update.error": "❌ Une erreur est survenue lors de la mise à jour.",
  },
  en: {
    "progress.download": "{{label}}: downloading",
    "progress.downloadExtract": "{{label}}: downloading + extracting",
    "progress.extract": "{{label}}: extracting",
    "progress.mods": "{{label}}: mods",
    "progress.removed": "{{label}} removed",
    "progress.cancelled": "cancelled",
    "install.alreadyRunning": "An installation is already in progress",
    "log.start": "Sync [{{channel}}]{{mode}}: {{count}} entries",
    "log.repairMode": " in repair mode",
    "log.entryStart": "▶ ({{index}}/{{total}}) {{entry}}: {{message}}",
    "log.entryDone": "✔ {{entry}}: done",
    "log.entryDoneWith": "✔ {{entry}}: {{message}}",
    "log.entryError": "✖ {{entry}}: {{message}}",
    "log.summary": "Sync finished in {{seconds}}s: {{ok}} succeeded, {{failed}} failed{{cancelled}}",
    "log.cancelled": ", cancelled",
    "update.noServer": "❌ No connection to the server. Unable to check for updates.",
    "update.checkFailed": "❌ Update check failed.",
    "update.checking": "🔍 Checking for updates...",
    "update.none": "🟢 No update available.",
    "update.available": "🔄 Update available...\n({{from}} --> {{to}})",
    "update.downloadFailed": "❌ Update download failed.",
    "update.progress": "📥 {{percent}}% ({{done}} / {{total}})\n at {{speed}}",
    "update.downloaded": "✅ Update downloaded. Restarting...",
    "update.error": "❌ An error occurred during the update.",
  },
} as const;

export type MessageKey = keyof (typeof MESSAGES)["fr"];
export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

export const translate = (lang: Lang, key: MessageKey, vars: Record<string, string | number> = {}): string =>
  MESSAGES[lang][key].replace(/{{\s*(\w+)\s*}}/g, (_, name: string) => String(vars[name] ?? ""));

export const translator = (lang: Lang): Translate => (key, vars) => translate(lang, key, vars);

export const MESSAGE_LANGS = MESSAGES;
