/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Installation / mise à jour d'une instance (un canal) à partir du latest.yml :
 * une entrée = un provider, dans l'ordre game-base → game-breaking → game-notbreaking.
 * Chaque entrée réussie est enregistrée dans l'état de l'installation : une
 * synchronisation interrompue reprend où elle s'est arrêtée.
 */

import fs from "fs";
import path from "path";

import type {
  Channel,
  GamePlatform,
  InstanceSyncProgress,
  InstanceSyncResult,
  ReleaseEntry,
} from "@shared/types";

import { entryDirectory } from "./instance-paths";
import { buildRow, TIERS, type InstanceInspector } from "./InstanceInspector";
import { readInstallState, readInstanceSettings, recordInstalledEntry } from "./install-store";
import { removeWithPlan } from "./fs-ops";
import type { ParamResolver } from "./ParamResolver";
import { hashProvider } from "./providers/hash";
import { thunderstoreProvider } from "./providers/thunderstore";
import type { InstallIO, Provider } from "./providers/types";
import { zipProvider } from "./providers/zip";
import { planEntryUpdate } from "./preserve";

export const DEFAULT_PROVIDERS: Record<string, Provider> = {
  zip_url: zipProvider,
  hash_url: hashProvider,
  thunderstore_modpack_url: thunderstoreProvider,
  // nexus_modpack_url : pas encore implémenté (l'entrée est signalée en échec).
};

export interface InstallerOptions {
  inspector: InstanceInspector;
  resolver: ParamResolver;
  platform: GamePlatform;
  io: InstallIO;
  providers?: Record<string, Provider>;
}

export interface SyncOptions {
  onProgress?: (progress: InstanceSyncProgress) => void;
  signal?: AbortSignal;
}

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export class InstanceInstaller {
  /** Une seule synchronisation à la fois par installation. */
  private readonly running = new Set<string>();

  constructor(private readonly options: InstallerOptions) {}

  async sync(id: string, channel: Channel, { onProgress, signal }: SyncOptions = {}): Promise<InstanceSyncResult> {
    const { inspector, resolver, platform, io } = this.options;
    const providers = this.options.providers ?? DEFAULT_PROVIDERS;

    const loaded = await inspector.load(id, channel);
    const { installDir } = loaded.locations;
    if (!loaded.release) {
      throw new Error(loaded.errors.join(" ; ") || "latest.yml indisponible");
    }

    const lockKey = path.resolve(installDir);
    if (this.running.has(lockKey)) throw new Error("Une installation est déjà en cours");
    this.running.add(lockKey);

    const result: InstanceSyncResult = { installed: [], failed: [], works: false };
    const tempDir = path.join(installDir, ".tmp");

    try {
      fs.rmSync(tempDir, { recursive: true, force: true }); // reste d'une synchro interrompue
      fs.mkdirSync(tempDir, { recursive: true });

      const settings = readInstanceSettings(installDir);
      const state = readInstallState(installDir);

      // Entrées à traiter, dans l'ordre.
      const todo: { name: string; entry: ReleaseEntry; tier: (typeof TIERS)[number]; error?: string }[] = [];
      for (const tier of TIERS) {
        for (const [name, entry] of Object.entries(loaded.release[tier] ?? {})) {
          const prefix = `latest.${tier}.${name}`;
          const entryErrors = loaded.releaseErrors.filter(
            (error) => error.startsWith(`${prefix}.`) || error.startsWith(`${prefix} `),
          );
          const row = buildRow(name, tier, entry, entryErrors, state.entries[name], settings);
          if (row.status === "invalid") {
            todo.push({ name, entry, tier, error: entryErrors.join(" ; ") });
          } else if (row.status === "outdated" || row.status === "not-installed") {
            todo.push({ name, entry, tier });
          }
        }
      }

      const emit = (progress: Omit<InstanceSyncProgress, "id" | "channel">) =>
        onProgress?.({ id, channel, ...progress });

      let index = 0;
      for (const item of todo) {
        index++;
        const common = { entry: item.name, index, total: todo.length };
        emit({ ...common, step: "start", message: `${item.name} (${item.entry.version})` });

        try {
          if (item.error) throw new Error(`entrée invalide : ${item.error}`);
          const provider = providers[String(item.entry.type)];
          if (!provider) throw new Error(`type « ${item.entry.type} » non pris en charge`);

          const entryDir = entryDirectory(installDir, item.entry.path, loaded.config.allowedPaths);
          const previous = state.entries[item.name];
          const plan = planEntryUpdate(item.entry, previous?.version);

          removeWithPlan(entryDir, item.entry.gameFolderToRemove ?? [], plan);

          const provided = await provider({
            name: item.name,
            entry: item.entry,
            entryDir,
            tempDir,
            plan,
            platform,
            resolver,
            io,
            previousOwned: previous?.owned ?? [],
            signal,
            report: (step, message) => emit({ ...common, step, message }),
          });

          recordInstalledEntry(installDir, item.name, {
            version: String(item.entry.version),
            hash: provided.hash,
            owned: provided.owned,
          });
          result.installed.push(item.name);
          emit({ ...common, step: "done" });
        } catch (error) {
          const message = messageOf(error);
          result.failed.push({ name: item.name, error: message });
          emit({ ...common, step: "error", message });
          // Les entrées suivantes reposent sur la base : on s'arrête si elle échoue.
          if (item.tier === "game-base") break;
        }
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
      this.running.delete(lockKey);
    }

    result.works = (await inspector.report(id, channel)).summary.works;
    return result;
  }
}
