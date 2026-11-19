/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Registre des instances : croise les configs main avec l'`index.config.json` de
 * chaque jeu (`games/<id>/index.config.json`). Le main est la source de vérité de la
 * liste ; le renderer rattache sa propre config (affichage) par `id`.
 */

import type { Channel, GamePlatform, InstanceSummary, RemoteIndex } from "@shared/types";

import type { InstanceMainConfig } from "../instances.types";
import { isFetchableLink } from "./link";
import type { ParamResolver } from "./ParamResolver";
import { validateRemoteIndex } from "./validate";

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
        if (isFetchableLink(index.channels?.stable)) channels.push("stable");
        if (isFetchableLink(index.channels?.beta)) channels.push("beta");

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

/** Télécharge et valide l'`index.config.json` d'un jeu. Ne lève jamais. */
export async function loadRemoteIndex(
  resolver: ParamResolver,
  indexUrl: string,
  expectedId: string,
): Promise<IndexLoad> {
  try {
    const { value, source } = await resolver.getJson<unknown>(indexUrl);
    if (source === "inline") {
      return { kind: "unreachable", errors: ["indexUrl doit être un lien, pas une donnée"] };
    }

    const result = validateRemoteIndex(value, expectedId);
    return result.ok
      ? { kind: "ok", index: result.value, source }
      : { kind: "invalid", errors: result.errors, source };
  } catch (error) {
    return {
      kind: "unreachable",
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}
