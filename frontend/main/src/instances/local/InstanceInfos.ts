/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Infos d'accueil d'une instance : serveur de jeu, événement, maintenance.
 * L'événement et la maintenance sont décrits par l'index remote (lien ou donnée inline).
 * Les résultats sont gardés quelques secondes : l'accueil les interroge en boucle
 * (la requête au serveur de jeu, la plus coûteuse, est aussi partagée entre appels simultanés).
 */

import type {
  CheckInfosResult,
  GameEvent,
  GamePlatform,
  Maintenance,
  ServerInfos,
} from "@shared/types";

import type { ServerQueryConfig } from "../../types/core.js";
import type { InstanceMainConfig } from "../instances.types.js";
import { loadRemoteIndex } from "../remote/InstanceRegistry.js";
import type { ParamResolver } from "../remote/ParamResolver.js";
import { LocalizedError } from "../../lib/errors/localized-error.js";

export interface InfosOptions {
  configs: readonly InstanceMainConfig[];
  resolver: ParamResolver;
  platform: GamePlatform;
  queryServer: (server: ServerQueryConfig) => Promise<ServerInfos>;
  /** Durée de conservation de l'événement et de la maintenance (ms). */
  ttlMs?: number;
  /** Durée de conservation de la réponse du serveur de jeu (ms). */
  serverTtlMs?: number;
  now?: () => number;
}

interface Cached {
  at: number;
  event: GameEvent | false;
  maintenance: Maintenance | false;
}

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export class InstanceInfos {
  private readonly cache = new Map<string, Cached>();
  private readonly servers = new Map<string, { at: number; value: Promise<ServerInfos> }>();

  constructor(private readonly options: InfosOptions) {}

  async get(id: string): Promise<CheckInfosResult> {
    const config = this.options.configs.find((item) => item.id === id);
    if (!config) throw new LocalizedError("err.unknownInstance", { id });

    const [serverInfos, remote] = await Promise.all([
      this.server(config),
      this.remote(config),
    ]);
    return { serverInfos, event: remote.event, maintenance: remote.maintenance };
  }

  /** Réponse du serveur de jeu gardée quelques secondes ; une requête en cours est réutilisée. */
  private server(config: InstanceMainConfig): Promise<ServerInfos> {
    const { serverTtlMs = 4000, now = Date.now } = this.options;
    const cached = this.servers.get(config.id);
    if (cached && now() - cached.at < serverTtlMs) return cached.value;
    const value = this.options.queryServer(config.server);
    this.servers.set(config.id, { at: now(), value });
    return value;
  }

  private async remote(config: InstanceMainConfig): Promise<Cached> {
    const { resolver, ttlMs = 5000, now = Date.now } = this.options;
    const cached = this.cache.get(config.id);
    if (cached && now() - cached.at < ttlMs) return cached;

    const load = await loadRemoteIndex(resolver, config.indexUrl, config.id);
    const entry = load.kind === "ok" ? load.index : undefined;

    const fresh: Cached = {
      at: now(),
      event: entry?.event === undefined ? false : await this.read<GameEvent>(entry.event, "événement", (value) => this.withImage(value)),
      maintenance: entry?.maintenance === undefined ? false : await this.read<Maintenance>(entry.maintenance, "maintenance"),
    };
    this.cache.set(config.id, fresh);
    return fresh;
  }

  private async read<T extends object>(
    param: unknown,
    label: string,
    transform: (value: T) => T = (value) => value,
  ): Promise<T | false> {
    try {
      const { value } = await this.options.resolver.getJson<T>(param as string | T);
      return value && typeof value === "object" ? transform(value) : false;
    } catch (error) {
      console.error(`Error getting ${label}:`, messageOf(error));
      return false;
    }
  }

  /** `/image.png` devient une URL du serveur de fichiers ; `data:` et `https:` restent tels quels. */
  private withImage(event: GameEvent): GameEvent {
    if (typeof event.image !== "string" || event.image.startsWith("data:")) return event;
    return { ...event, image: this.options.resolver.urlOf(event.image) };
  }
}
