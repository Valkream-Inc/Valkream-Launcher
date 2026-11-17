/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Registre des instances : croise les configs main avec l'index remote.
 * Le main est la source de vérité de la liste ; le renderer rattache sa propre
 * config (affichage) par `id`.
 */

import type {
  Channel,
  GamePlatform,
  InstanceSummary,
  RemoteIndex,
} from "@shared/types";

import type { InstanceMainConfig } from "../types/instances";
import { isFetchableLink } from "./link";
import type { ParamResolver } from "./ParamResolver";
import { validateRemoteIndex } from "./validate";

export interface InstanceRegistryOptions {
  configs: readonly InstanceMainConfig[];
  resolver: ParamResolver;
  platform: GamePlatform;
}

type IndexLoad =
  | { kind: "ok"; index: RemoteIndex; source: "online" | "cache" }
  | { kind: "invalid"; errors: string[]; source: "online" | "cache" }
  | { kind: "unreachable"; errors: string[] };

export class InstanceRegistry {
  constructor(private readonly options: InstanceRegistryOptions) {}

  /** Une ligne par config main, dans l'ordre de `configs`. Ne lève jamais. */
  async list(): Promise<InstanceSummary[]> {
    const { configs, resolver, platform } = this.options;

    // Plusieurs instances partagent le plus souvent le même index : un seul téléchargement.
    const loads = new Map<string, Promise<IndexLoad>>();
    const loadIndex = (indexUrl: string): Promise<IndexLoad> => {
      let load = loads.get(indexUrl);
      if (!load) {
        load = this.fetchIndex(resolver, indexUrl);
        loads.set(indexUrl, load);
      }
      return load;
    };

    return Promise.all(
      configs.map(async (config): Promise<InstanceSummary> => {
        const load = await loadIndex(config.indexUrl);

        if (load.kind === "unreachable") {
          return {
            id: config.id,
            availability: "unreachable",
            channels: [],
            indexSource: "none",
            errors: load.errors,
          };
        }

        if (load.kind === "invalid") {
          return {
            id: config.id,
            availability: "invalid",
            channels: [],
            indexSource: load.source,
            errors: load.errors,
          };
        }

        const entry = load.index.instances.find((item) => item.id === config.id);
        if (!entry) {
          return {
            id: config.id,
            availability: "not-in-index",
            channels: [],
            indexSource: load.source,
            errors: [`« ${config.id} » est absent de l'index remote`],
          };
        }

        const channels: Channel[] = [];
        if (isFetchableLink(entry.channels?.stable) || config.gameUrl) channels.push("stable");
        if (isFetchableLink(entry.channels?.beta)) channels.push("beta");

        return {
          id: config.id,
          availability: entry.enabled[platform] === true ? "enabled" : "disabled",
          channels,
          indexSource: load.source,
          errors: [],
        };
      }),
    );
  }

  private async fetchIndex(resolver: ParamResolver, indexUrl: string): Promise<IndexLoad> {
    try {
      const { value, source } = await resolver.getJson<unknown>(indexUrl);
      if (source === "inline") {
        return { kind: "unreachable", errors: ["indexUrl doit être un lien, pas une donnée"] };
      }

      const result = validateRemoteIndex(value);
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
}
