/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Règle de lien des configs remote : une chaîne est
 * - `http(s)://…`  : une URL ;
 * - `/chemin`      : relatif à la racine du serveur de fichiers ;
 * - `data:…`       : une donnée (ex : image) ;
 * toute autre chaîne est invalide. Module pur.
 */

import type { EntryContent, EntryContentByPlatform, GamePlatform } from "@shared/types";

export type LinkKind = "url" | "relative" | "data" | "invalid";

export const classifyLink = (value: string): LinkKind => {
  const trimmed = value.trim();
  if (/^https?:\/\/\S+$/i.test(trimmed)) return "url";
  if (/^data:/i.test(trimmed)) return "data";
  // "//hote/x" (protocol-relative) est ambigu : refusé.
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return "relative";
  return "invalid";
};

/** Lien utilisable pour un téléchargement (URL ou relatif), pas une donnée. */
export const isFetchableLink = (value: unknown): value is string =>
  typeof value === "string" &&
  (classifyLink(value) === "url" || classifyLink(value) === "relative");

/** Transforme un lien en URL absolue. Lève pour une donnée ou un lien invalide. */
export const resolveLinkUrl = (value: string, baseUrl: string): string => {
  const kind = classifyLink(value);
  const trimmed = value.trim();

  if (kind === "url") return trimmed;

  if (kind === "relative") {
    const segments = trimmed.split(/[/\\]/);
    if (segments.includes("..")) {
      throw new Error(`Lien relatif refusé (« .. ») : ${value}`);
    }
    return baseUrl.replace(/\/+$/, "") + "/" + trimmed.replace(/^\/+/, "");
  }

  throw new Error(
    kind === "data"
      ? `Un lien data: ne peut pas être téléchargé : ${value.slice(0, 30)}…`
      : `Lien invalide (attendu http(s)://… ou /chemin) : ${value}`,
  );
};

const PLATFORM_KEYS: readonly string[] = ["win32", "linux", "darwin", "default"];

/**
 * Un objet est une table « par plateforme » si TOUTES ses clés sont des
 * plateformes (ou `default`). Sinon c'est une donnée inline (ex : manifeste de hash).
 */
export const isPerPlatformContent = (
  content: EntryContentByPlatform,
): content is Partial<Record<GamePlatform | "default", EntryContent>> => {
  if (content === null || typeof content !== "object" || Array.isArray(content)) {
    return false;
  }
  const keys = Object.keys(content);
  return keys.length > 0 && keys.every((key) => PLATFORM_KEYS.includes(key));
};

/** Contenu applicable à `platform` (clé exacte, sinon `default`), ou undefined. */
export const contentForPlatform = (
  content: EntryContentByPlatform,
  platform: GamePlatform,
): EntryContent | undefined => {
  if (!isPerPlatformContent(content)) return content;
  return content[platform] ?? content.default;
};
