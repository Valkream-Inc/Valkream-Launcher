/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Variantes d'une valeur de configuration : TOUTE clé de TOUT fichier de config (index, latest, liste de mods,
 * événement, contributeurs…) peut être déclinée, dans cet ordre, par canal, puis plateforme, puis langue :
 *
 *   event: /games/x/event.json                              ← une valeur pour tous
 *   event: { stable: /…/event.json, beta: /…/beta.json }    ← par canal
 *   depot: { win32: { id: 1, manifest: "…" }, linux: {…} }  ← par plateforme
 *   description: { fr: "Bonjour", en: "Hello" }             ← par langue
 *   mods: { beta: { win32: { fr: /…/mods-fr.json } } }      ← combinables (même sans que cela ait un sens :
 *                                                             une base commune, simple à maintenir)
 *
 * Une table de variantes est un objet dont TOUTES les clés sont du même type (canaux, plateformes ou langues),
 * éventuellement avec `default`. Une valeur de données (événement, liste…) n'en est donc jamais une.
 * Valeur absente : canal → `default`, sinon `stable` ; plateforme → `default` ; langue → `default`, sinon `fr`, sinon `en`.
 * Quand le contexte ne précise pas un type (ex : pas de canal), les tables de ce type sont laissées telles quelles.
 */

import type { Channel, GamePlatform } from "@shared/types";

export type VariantKind = "channel" | "platform" | "language";
export type Language = "fr" | "en";

export const VARIANT_KEYS: Readonly<Record<VariantKind, readonly string[]>> = {
  channel: ["stable", "beta", "alpha"],
  platform: ["win32", "linux", "darwin"],
  language: ["fr", "en"],
};

export interface VariantContext {
  channel?: Channel;
  platform?: GamePlatform;
  language?: Language;
}

/**
 * Clés dont la valeur est déjà une table propre au format (jamais une variante) : `channels` (lien par canal)
 * et `enabled` (activation par plateforme) de l'index.
 */
export const STRUCTURAL_KEYS: ReadonlySet<string> = new Set(["channels", "enabled"]);

type RawRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is RawRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/** Type de la table (`any` : seulement `default`), `null` si l'objet est une donnée. */
export const variantKind = (value: unknown): VariantKind | "any" | null => {
  if (!isRecord(value)) return null;
  const keys = Object.keys(value);
  if (keys.length === 0) return null;
  if (keys.length === 1 && keys[0] === "default") return "any";
  for (const kind of Object.keys(VARIANT_KEYS) as VariantKind[]) {
    if (keys.every((key) => key === "default" || VARIANT_KEYS[kind].includes(key))) return kind;
  }
  return null;
};

export const isVariantTable = (value: unknown): value is RawRecord => variantKind(value) !== null;

const pick = (table: RawRecord, kind: VariantKind | "any", context: VariantContext): unknown => {
  switch (kind) {
    case "channel":
      return table[context.channel as string] ?? table.default ?? table.stable;
    case "platform":
      return table[context.platform as string] ?? table.default;
    case "language":
      return table[context.language as string] ?? table.default ?? table.fr ?? table.en;
    default:
      return table.default;
  }
};

/**
 * Valeur applicable au contexte, en profondeur. Une table sans valeur pour le contexte disparaît (clé retirée d'un
 * objet, élément retiré d'un tableau) ; `undefined` à la racine.
 */
export const resolveVariants = (
  value: unknown,
  context: VariantContext,
  keep: ReadonlySet<string> = STRUCTURAL_KEYS,
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => resolveVariants(item, context, keep)).filter((item) => item !== undefined);
  }
  if (!isRecord(value)) return value;

  const kind = variantKind(value);
  if (kind !== null && (kind === "any" || context[kind] !== undefined)) {
    return resolveVariants(pick(value, kind, context), context, keep);
  }

  const resolved: RawRecord = {};
  for (const [key, item] of Object.entries(value)) {
    if (keep.has(key)) {
      resolved[key] = item;
      continue;
    }
    const inner = resolveVariants(item, context, keep);
    if (inner !== undefined) resolved[key] = inner;
  }
  return resolved;
};

/** Toutes les combinaisons canal × plateforme × langue : sert à valider TOUTES les variantes d'un fichier. */
export const allVariantContexts = (): VariantContext[] => {
  const contexts: VariantContext[] = [];
  for (const channel of VARIANT_KEYS.channel as readonly Channel[]) {
    for (const platform of VARIANT_KEYS.platform as readonly GamePlatform[]) {
      for (const language of VARIANT_KEYS.language as readonly Language[]) {
        contexts.push({ channel, platform, language });
      }
    }
  }
  return contexts;
};
