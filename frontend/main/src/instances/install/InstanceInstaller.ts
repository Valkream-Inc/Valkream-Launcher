/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Installation / mise à jour d'une instance (un canal) à partir du latest.yml :
 * une entrée = un provider, dans l'ordre game-base → game-details.
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

import { type Lang, type Translate, translator } from "../../lib/messages.js";
import { isPathInside } from "../../lib/paths.js";
import { entryDirectory } from "../local/instance-paths.js";
import {
  buildRow,
  type InstanceInspector,
  TIERS,
} from "../local/InstanceInspector.js";
import { locateSteamGame, type SteamGame } from "../local/steam-library.js";
import type { ParamResolver } from "../remote/ParamResolver.js";
import { removeWithPlan } from "./fs-ops.js";
import {
  clearGameSourceDir,
  DEPOT_DIR,
  GameSourceError,
  type GuideLanguage,
  readGameSourceDir,
  toSteamSourceIssue,
} from "./game-source.js";
import { HashCache } from "./hash-cache.js";
import { appendInstallLog } from "./install-log.js";
import {
  readInstallState,
  readInstanceSettings,
  recordInstalledEntry,
  removeInstalledEntry,
} from "./install-store.js";
import { loadEntryContent } from "./local-content.js";
import { planEntryUpdate } from "./preserve.js";
import { ArchiveCache } from "./providers/archive-cache.js";
import { hashProvider, steamLibraryProvider } from "./providers/hash.js";
import {
  thunderstoreProvider,
  thunderstoreUninstall,
} from "./providers/thunderstore.js";
import { nexusProvider, nexusUninstall } from "./providers/nexus.js";
import type { InstallIO, Provider, Uninstaller } from "./providers/types.js";
import { zipProvider } from "./providers/zip.js";
import { errorText, errorTexts, LocalizedError } from "../../lib/localized-error.js";

const DEFAULT_PROVIDERS: Record<string, Provider> = {
  zip_url: zipProvider,
  hash_url: hashProvider,
  steam_library: steamLibraryProvider,
  thunderstore_modpack_url: thunderstoreProvider,
  nexus_modpack_url: nexusProvider,
};

const DEFAULT_UNINSTALLERS: Record<string, Uninstaller> = {
  thunderstore_modpack_url: thunderstoreUninstall,
  nexus_modpack_url: nexusUninstall,
  // Les autres types ne savent pas quels fichiers leur appartiennent : seul l'état est oublié.
};

export interface InstallerOptions {
  inspector: InstanceInspector;
  resolver: ParamResolver;
  platform: GamePlatform;
  io: InstallIO;
  providers?: Record<string, Provider>;
  uninstallers?: Record<string, Uninstaller>;
  /** Langue de l'interface (mode d'emploi Steam) ; défaut : français. */
  language?: () => Promise<GuideLanguage> | GuideLanguage;
  /** Clé API Nexus Mods du joueur (réglage local). */
  nexusApiKey?: () => Promise<string> | string;
  /** Retrouve le jeu dans la bibliothèque Steam du joueur (injectable pour les tests). */
  steamLocator?: (appId: number) => Promise<SteamGame | null>;
  /** Octets libres du disque contenant ce dossier (injectable pour les tests). */
  freeSpace?: (directory: string) => number;
}

export interface SyncOptions {
  /** Retélécharge aussi les fichiers modifiés ou manquants des entrées `hash_url`. */
  repair?: boolean;
  onProgress?: (progress: InstanceSyncProgress) => void;
  signal?: AbortSignal;
}

/** Octets libres du disque qui contient `directory` (ou son premier parent existant). */
const diskFreeBytes = (directory: string): number => {
  let current = path.resolve(directory);
  while (!fs.existsSync(current) && path.dirname(current) !== current)
    current = path.dirname(current);
  const stats = fs.statfsSync(current);
  return stats.bavail * stats.bsize;
};

/** Les téléchargements partiels (`.zip`, `.part`, `.meta`) survivent 7 jours pour être repris. */
const PARTIAL_MAX_AGE_MS = 7 * 24 * 3600 * 1000;
const isPartial = (name: string): boolean => /\.(zip|part|meta)$/.test(name);

const cleanTempDir = (tempDir: string): void => {
  let names: string[];
  try {
    names = fs.readdirSync(tempDir);
  } catch {
    return;
  }
  for (const name of names) {
    const file = path.join(tempDir, name);
    const stale = Date.now() - fs.statSync(file).mtimeMs > PARTIAL_MAX_AGE_MS;
    if (!isPartial(name) || stale)
      fs.rmSync(file, { recursive: true, force: true });
  }
};

/** Intervalle minimal entre deux événements de progression envoyés à l'interface. */
const PROGRESS_INTERVAL_MS = 250;

export class InstanceInstaller {
  /** Une seule synchronisation à la fois par installation. */
  private readonly running = new Set<string>();

  constructor(private readonly options: InstallerOptions) {}

  /** Une synchronisation est-elle en cours dans ce dossier d'installation ? */
  isBusy(installDir: string): boolean {
    return this.running.has(path.resolve(installDir));
  }

  async sync(
    id: string,
    channel: Channel,
    { onProgress, signal, repair = false }: SyncOptions = {},
  ): Promise<InstanceSyncResult> {
    const { inspector, resolver, platform, io } = this.options;
    const providers = this.options.providers ?? DEFAULT_PROVIDERS;

    const loaded = await inspector.load(id, channel);
    const { installDir } = loaded.locations;
    if (!loaded.release) {
      throw loaded.errors.length > 0 ? new Error(loaded.errors.join(" ; ")) : new LocalizedError("err.latestUnavailable");
    }

    const lang: Lang = (await this.options.language?.()) ?? "fr";
    const base = translator(lang);
    // Les messages de progression gardent leur clé + variables : le renderer les traduit à l'affichage
    // (changer de langue en cours de téléchargement met le bouton à jour tout de suite).
    const known = new Map<string, { key: string; vars?: Record<string, string | number> }>();
    const t: Translate = (key, vars) => {
      const text = base(key, vars);
      known.set(text, { key, vars });
      return text;
    };
    const lockKey = path.resolve(installDir);
    if (this.running.has(lockKey)) throw new LocalizedError("install.alreadyRunning");
    this.running.add(lockKey);

    const result: InstanceSyncResult = {
      installed: [],
      failed: [],
      works: false,
    };
    const hashes = new HashCache(installDir);
    const tempDir = path.join(installDir, ".tmp");

    const syncStartedAt = Date.now();
    try {
      cleanTempDir(tempDir); // restes d'une synchro interrompue (les téléchargements partiels sont gardés)
      fs.mkdirSync(tempDir, { recursive: true });

      const settings = {
        ...loaded.config.defaultSettings,
        ...readInstanceSettings(installDir),
      };
      const state = readInstallState(installDir);
      const modified = repair
        ? new Set(
            (
              await inspector.report(id, channel, { verify: true, fresh: true })
            ).entries
              .filter((row) => row.status === "modified")
              .map((row) => row.name),
          )
        : new Set<string>();

      // Entrées à traiter, dans l'ordre.
      const todo: {
        name: string;
        entry: ReleaseEntry;
        tier: (typeof TIERS)[number];
        error?: string;
        remove?: boolean;
      }[] = [];
      for (const tier of TIERS) {
        for (const [name, entry] of Object.entries(
          loaded.release[tier] ?? {},
        )) {
          const prefix = `latest.${tier}.${name}`;
          const entryErrors = loaded.releaseErrors.filter(
            (error) =>
              error.startsWith(`${prefix}.`) || error.startsWith(`${prefix} `),
          );
          const row = buildRow(
            name,
            tier,
            entry,
            entryErrors,
            state.entries[name],
            settings,
          );
          if (row.status === "invalid") {
            todo.push({ name, entry, tier, error: entryErrors.join(" ; ") });
          } else if (row.pendingRemoval) {
            todo.push({ name, entry, tier, remove: true });
          } else if (
            row.status === "outdated" ||
            row.status === "not-installed" ||
            modified.has(name)
          ) {
            todo.push({ name, entry, tier });
          }
        }
      }

      // Première installation du jeu : l'espace disque exigé par l'index doit être disponible.
      if (
        loaded.requiredSpaceMb &&
        todo.some(
          (item) =>
            item.tier === "game-base" &&
            !item.remove &&
            !state.entries[item.name],
        )
      ) {
        const free = (this.options.freeSpace ?? diskFreeBytes)(installDir);
        if (free < loaded.requiredSpaceMb * 1024 ** 2) {
          throw new LocalizedError("err.diskSpace", { free: Math.floor(free / 1024 ** 2), needed: loaded.requiredSpaceMb });
        }
      }

      // Progression : au plus une mise à jour toutes les PROGRESS_INTERVAL_MS (le renderer ne suit pas
      // des dizaines d'événements par seconde) ; début / fin / erreur / 100 % passent toujours.
      const startedAt = Date.now();
      let lastProgress = 0;
      const emit = ({
        texts,
        ...progress
      }: Omit<InstanceSyncProgress, "id" | "channel" | "elapsedMs"> & {
        texts?: Record<Lang, string>;
      }) => {
        const now = Date.now();
        const frequent =
          !["start", "done", "error"].includes(progress.step) &&
          progress.transfer?.percent !== 100;
        if (frequent) {
          if (now - lastProgress < PROGRESS_INTERVAL_MS) return;
          lastProgress = now;
        }
        // Journal : début / fin / erreur de chaque entrée (pas la progression des téléchargements).
        if (
          progress.step === "start" ||
          progress.step === "done" ||
          progress.step === "error"
        ) {
          const entry = progress.entry ?? "";
          if (progress.step === "start") {
            appendInstallLog(installDir, "log.entryStart", {
              index: progress.index ?? 0,
              total: progress.total ?? 0,
              entry,
              message: progress.message ?? "",
            });
          } else if (progress.step === "done") {
            // Un message à la fin d'une entrée = entrée optionnelle retirée.
            appendInstallLog(
              installDir,
              progress.message ? "log.entryRemoved" : "log.entryDone",
              { entry },
            );
          } else if (progress.message === t("progress.cancelled")) {
            appendInstallLog(
              installDir,
              "log.entryCancelled",
              { entry },
              "WARN",
            );
          } else {
            appendInstallLog(
              installDir,
              "log.entryError",
              { entry, message: progress.message ?? "" },
              "ERROR",
              { texts },
            );
          }
        }
        const message = progress.message !== undefined ? known.get(progress.message) : undefined;
        onProgress?.({
          id,
          channel,
          elapsedMs: now - startedAt,
          ...progress,
          ...(message && { messageKey: message.key, messageVars: message.vars }),
        });
      };
      // Archives partagées : combien d'entrées utilisent chaque lien (supprimée après la dernière).
      const archiveUses = new Map<string, number>();
      for (const item of todo) {
        if (item.remove || item.error) continue;
        const link =
          item.entry.type === "zip_url" ? item.entry.content : item.entry.zip;
        if (typeof link === "string")
          archiveUses.set(link, (archiveUses.get(link) ?? 0) + 1);
      }
      const archives = new ArchiveCache(archiveUses);

      appendInstallLog(
        installDir,
        "log.start",
        { channel, repair: repair ? 1 : 0, count: todo.length },
        "INFO",
        { separator: true },
      );

      let index = 0;
      for (const item of todo) {
        if (signal?.aborted) {
          result.cancelled = true;
          break;
        }
        index++;
        const common = { entry: item.name, index, total: todo.length };
        emit({
          ...common,
          step: "start",
          message: `${item.name} (${item.entry.version})`,
        });

        try {
          if (item.error) throw new LocalizedError("err.entryInvalid", { error: item.error });

          if (item.remove) {
            // Entrée optionnelle désactivée par le joueur : on retire ses mods puis on l'oublie.
            const uninstall = (this.options.uninstallers ??
              DEFAULT_UNINSTALLERS)[String(item.entry.type)];
            await uninstall?.({
              entryDir: entryDirectory(installDir, item.entry.path),
              previousOwned: state.entries[item.name]?.owned ?? [],
            });
            removeInstalledEntry(installDir, item.name);
            result.installed.push(item.name);
            emit({
              ...common,
              step: "done",
              message: t("progress.removed", { label: item.name }),
            });
            continue;
          }
          const provider = providers[String(item.entry.type)];
          if (!provider)
            throw new LocalizedError("err.typeUnsupported", {
              type: String(item.entry.type),
            });

          const entryDir = entryDirectory(installDir, item.entry.path);
          const previous = state.entries[item.name];
          // Dossier changé depuis l'installation : réinstallation complète, l'ancien dossier est nettoyé.
          const pathChanged =
            previous?.path !== undefined && previous.path !== item.entry.path;
          const plan = planEntryUpdate(
            item.entry,
            pathChanged ? undefined : previous?.version,
          );

          // Rien n'est retiré ni écrit dans l'installation avant que tout soit prêt (voir staging.ts).
          let removed = false;
          const beforeCommit = () => {
            if (removed) return;
            removed = true;
            removeWithPlan(entryDir, item.entry.gameFolderToRemove ?? [], plan);
          };

          const provided = await provider({
            name: item.name,
            entry: item.entry,
            entryDir,
            tempDir,
            plan,
            platform,
            resolver,
            io,
            hashes,
            previousOwned: pathChanged ? [] : (previous?.owned ?? []),
            signal,
            archives,
            nexusApiKey: async () => (await this.options.nexusApiKey?.()) ?? "",
            steam: async () => {
              // Dossier indiqué par le joueur (ou téléchargé par DepotDownloader) : prioritaire.
              const chosen = readGameSourceDir(installDir);
              if (chosen) return { dir: chosen, buildId: "", chosen: true };
              return loaded.config.steamAppId === undefined
                ? null
                : (this.options.steamLocator ?? locateSteamGame)(
                    loaded.config.steamAppId,
                  );
            },
            loadContent: () =>
              loadEntryContent(
                resolver,
                item.entry,
                installDir,
                loaded.release,
              ),
            beforeCommit,
            t,
            report: (step, message, transfer) =>
              emit({ ...common, step, message, transfer }),
          });

          beforeCommit();
          if (pathChanged && previous?.path !== undefined) {
            // Ancien dossier : on retire seulement ce que l'entrée possédait (mods listés), jamais le reste.
            const uninstall = (this.options.uninstallers ??
              DEFAULT_UNINSTALLERS)[String(item.entry.type)];
            await uninstall?.({
              entryDir: entryDirectory(installDir, previous.path),
              previousOwned: previous.owned ?? [],
            });
          }
          recordInstalledEntry(installDir, item.name, {
            version: String(item.entry.version),
            hash: provided.hash,
            owned: provided.owned,
            path: item.entry.path,
          });
          result.installed.push(item.name);
          emit({ ...common, step: "done" });
        } catch (error) {
          // Annulation demandée : on s'arrête sans compter d'échec (l'entrée reprendra à la prochaine synchro).
          if (signal?.aborted) {
            result.cancelled = true;
            emit({
              ...common,
              step: "error",
              message: t("progress.cancelled"),
            });
            break;
          }
          const message = errorText(error, lang);
          const steamIssue =
            error instanceof GameSourceError
              ? toSteamSourceIssue(error, {
                  entry: item.name,
                  appId: loaded.config.steamAppId,
                  branch: item.entry["steam-beta"],
                  depotAvailable:
                    item.entry.depot !== undefined &&
                    loaded.config.steamAppId !== undefined,
                  language: lang,
                })
              : undefined;
          result.failed.push({
            name: item.name,
            error: message,
            ...(steamIssue ? { steamIssue } : {}),
          });
          emit({
            ...common,
            step: "error",
            message,
            texts: errorTexts(error),
          });
          // Les entrées suivantes reposent sur la base : on s'arrête si elle échoue.
          if (item.tier === "game-base") break;
        }
      }
    } finally {
      appendInstallLog(
        installDir,
        "log.summary",
        {
          seconds: Math.round((Date.now() - syncStartedAt) / 1000),
          ok: result.installed.length,
          failed: result.failed.length,
          cancelled: result.cancelled ? 1 : 0,
        },
        result.failed.length > 0 ? "WARN" : "INFO",
      );
      hashes.prune();
      hashes.save();
      // Tout est passé : plus rien à garder. Sinon on garde les partiels pour reprendre.
      if (result.failed.length === 0 && !result.cancelled) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        // Le jeu téléchargé par DepotDownloader a été copié et vérifié : il ne sert plus (plusieurs Go).
        const depot = path.join(installDir, DEPOT_DIR);
        const source = readGameSourceDir(installDir);
        if (source && isPathInside(depot, source))
          clearGameSourceDir(installDir);
        fs.rmSync(depot, { recursive: true, force: true });
      } else cleanTempDir(tempDir);
      this.running.delete(lockKey);
    }

    result.works = (await inspector.report(id, channel)).summary.works;
    return result;
  }
}
