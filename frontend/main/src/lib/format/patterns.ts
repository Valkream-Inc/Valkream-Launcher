/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Motifs de chemins relatifs (conservation, exclusion du hash). Module pur.
 *
 * - `a/b.cfg`   : ce fichier ;
 * - `a/b`       : ce dossier et tout son contenu (aussi `a/b/`) ;
 * - `*`         : n'importe quels caractères sauf `/` ;
 * - `**`        : n'importe quels caractères, `/` compris ;
 * - `?`         : un caractère sauf `/`.
 * Les chemins comparés sont en `/`, sans `/` initial.
 */

/** Chemin relatif normalisé : séparateurs `/`, sans `./` ni `/` initial ou final. */
export const normalizeRelative = (value: string): string =>
  value
    .replace(/\\/g, "/")
    .replace(/^(\.\/)+/, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

const escapeRegExp = (text: string): string =>
  text.replace(/[.+^${}()|[\]\\]/g, "\\$&");

/** Transforme un motif en expression régulière (le dossier couvre son contenu). */
const patternToRegExp = (pattern: string): RegExp => {
  const normalized = normalizeRelative(pattern);
  let source = "";
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (char === "*") {
      if (normalized[i + 1] === "*") {
        source += ".*";
        i++;
        if (normalized[i + 1] === "/") i++; // `**/` couvre aussi zéro dossier
      } else {
        source += "[^/]*";
      }
    } else if (char === "?") {
      source += "[^/]";
    } else {
      source += escapeRegExp(char);
    }
  }
  return new RegExp(`^${source}(?:/.*)?$`);
};

export const matchesPattern = (relativePath: string, pattern: string): boolean => {
  const normalized = normalizeRelative(pattern);
  if (normalized === "") return false; // un motif vide ne doit jamais tout couvrir
  return patternToRegExp(normalized).test(normalizeRelative(relativePath));
};

export const matchesAny = (
  relativePath: string,
  patterns: readonly string[] | undefined,
): boolean => !!patterns && patterns.some((p) => matchesPattern(relativePath, p));
