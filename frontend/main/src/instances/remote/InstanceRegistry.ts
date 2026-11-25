/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Registre des instances : croise les configs main avec l'`index.config.json` de
 * chaque jeu (`games/<id>/index.config.json`). Le main est la source de vérité de la
 * liste ; le renderer rattache sa propre config (affichage) par `id`.
 */

import type { Channel, GamePlatform, InstanceSummary, RemoteIndex } from "@shared/types";

import type { InstanceMainConfig } from "../instances.types.js";
import { isFetchableLink } from "./link.js";
import type { ParamResolver } from "./ParamResolver.js";
import { validateRemoteIndex } from "./validate.js";
import { resolveVariants, type VariantContext } from "./variants.js";

export interface InstanceRegistryOptions {
  configs: readonly InstanceMainConfig[];
  resolver: ParamResolver;
  platform: GamePlatform;
}

export type IndexLoad =
  | { kind: "ok"; index: RemoteIndex; source: "online" | "cache" }
  | { kind: "invalid"; errors: string[]; source: "online" | "cache" }
  | { kind: "unreachable"; errors: string[] };

export class InstanceRegistry {
  constructor(private readonly options: InstanceRegistryOptions) {}

  /** Une ligne par config main, dans l'ordre de `configs`. Ne lève jamais. */
  async list(): Promise<InstanceSummary[]> {
    const { configs, resolver, platform } = this.options;

    return Promise.all(
      configs.map(async (config): Promise<InstanceSummary> => {
        const load = await loadRemoteIndex(resolver, config.indexUrl, config.id);

        if (load.kind === "unreachable") {
          return { id: config.id, availability: "unreachable", channels: [], indexSource: "none", errors: load.errors };
        }
        if (load.kind === "invalid") {
          return { id: config.id, availability: "invalid", channels: [], indexSource: load.source, errors: load.errors };
        }

        const { index } = load;
        const channels: Channel[] = [];
        for (const channel of ["stable", "beta", "alpha"] as const) {
          if (isFetchableLink(index.channels?.[channel])) channels.push(channel);
        }

        return {
          id: config.id,
          availability: index.enabled[platform] === true ? "enabled" : "disabled",
          channels,
          indexSource: load.source,
          errors: [],
        };
      }),
    );
  }
}

/**
 * Télécharge et valide l'index d'un jeu (YAML ou JSON, selon l'extension). Ne lève jamais.
 * `context` : canal / plateforme / langue du joueur, appliqués aux valeurs déclinées (les types absents du contexte
 * laissent leurs tables intactes ; `channels` et `enabled` ne sont jamais résolus).
 */
export async function loadRemoteIndex(
  resolver: ParamResolver,
  indexUrl: string,
  expectedId: string,
  context: VariantContext = {},
): Promise<IndexLoad> {
  try {
    const { value, source } = await resolver.getJson<unknown>(indexUrl);
    if (source === "inline") {
      return { kind: "unreachable", errors: ["indexUrl doit être un lien, pas une donnée"] };
    }

    const result = validateRemoteIndex(value, expectedId);
    return result.ok
      ? { kind: "ok", index: resolveVariants(result.value, context) as RemoteIndex, source }
      : { kind: "invalid", errors: result.errors, source };
  } catch (error) {
    return {
      kind: "unreachable",
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}
