/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Comparaison de versions numériques pointées (`1.2.3`) et plages simples.
 * Module pur.
 *
 * Plage : comparateurs `>= > <= < =` (ou version nue = égalité) séparés par des
 * espaces (ET), alternatives séparées par `||` (OU), `*`, jokers `1.x` / `1.2.x`.
 */

const parse = (version: string): number[] | null => {
  const core = String(version).trim().replace(/^v/i, "").split(/[-+]/)[0];
  if (!/^\d+(\.\d+)*$/.test(core)) return null;
  return core.split(".").map(Number);
};

/** -1, 0 ou 1. `null` si une des versions n'est pas numérique. */
export const compareVersions = (a: string, b: string): -1 | 0 | 1 | null => {
  const left = parse(a);
  const right = parse(b);
  if (!left || !right) return null;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) {
    const x = left[i] ?? 0;
    const y = right[i] ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
};

const matchComparator = (version: string, comparator: string): boolean => {
  if (comparator === "*" || comparator.toLowerCase() === "x") return true;

  // Joker : `1.x`, `1.2.x`, `1.2.*`
  const wildcard = comparator.match(/^v?(\d+(?:\.\d+)*)\.(?:x|\*)$/i);
  if (wildcard) {
    const prefix = wildcard[1].split(".").map(Number);
    const actual = parse(version);
    return !!actual && prefix.every((part, i) => (actual[i] ?? 0) === part);
  }

  const operation = comparator.match(/^(>=|<=|>|<|=)?\s*(.+)$/);
  if (!operation) return false;
  const result = compareVersions(version, operation[2]);
  if (result === null) return false;

  switch (operation[1] ?? "=") {
    case ">=":
      return result >= 0;
    case ">":
      return result > 0;
    case "<=":
      return result <= 0;
    case "<":
      return result < 0;
    default:
      return result === 0;
  }
};

/** `version` satisfait-elle `range` ? Une version ou plage illisible → faux. */
export const versionSatisfies = (version: string, range: string): boolean =>
  range
    .split("||")
    .some((alternative) => {
      // « >= 1.0.0 » (espace après l'opérateur) est accepté.
      const comparators = alternative
        .trim()
        .replace(/(>=|<=|>|<|=)\s+/g, "$1")
        .split(/\s+/)
        .filter(Boolean);
      return (
        comparators.length > 0 &&
        comparators.every((comparator) => matchComparator(version, comparator))
      );
    });

/** Plage syntaxiquement valide ? (pour la validation du latest.yml) */
export const isValidRange = (range: unknown): range is string => {
  if (typeof range !== "string" || range.trim() === "") return false;
  return range.split("||").every((alternative) => {
    const comparators = alternative
      .trim()
      .replace(/(>=|<=|>|<|=)\s+/g, "$1")
      .split(/\s+/)
      .filter(Boolean);
    return (
      comparators.length > 0 &&
      comparators.every(
        (c) =>
          c === "*" ||
          c.toLowerCase() === "x" ||
          /^v?\d+(\.\d+)*\.(x|\*)$/i.test(c) ||
          /^(>=|<=|>|<|=)?v?\d+(\.\d+)*$/.test(c),
      )
    );
  });
};
