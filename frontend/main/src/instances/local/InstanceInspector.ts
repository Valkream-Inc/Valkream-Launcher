/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Rapport d'une installation (instance + canal) : ce que le remote déclare,
 * ce qui est installé, ce qui est à jour. Alimente les onglets Mods et Debug.
 * Ne lève jamais pour une config distante cassée : les problèmes sont dans le rapport.
 */

import fs from "fs";

import type {
  Channel,
  Contributor,
  EntryReport,
  GamePlatform,
  InstanceReport,
  ModDisplay,
  InstanceSettingValue,
  ReleaseConfig,
  ReleaseEntry,
  ReleaseTier,
} from "@shared/types";

import { pickChannel } from "../remote/channel-value.js";
import type { InstanceMainConfig } from "../instances.types.js";
import { entryDirectory, installLocations, type InstallLocations } from "./instance-paths.js";
import { loadRemoteIndex } from "../remote/InstanceRegistry.js";
import { readInstallState, readInstanceSettings } from "../install/state/install-store.js";
import { HashCache } from "../install/files/hash-cache.js";
import { verifyManifest, type Manifest } from "../install/state/manifest.js";
import type { ParamResolver } from "../remote/ParamResolver.js";
import { resolvePreserved } from "../install/files/preserve.js";
import { loadEntryContent } from "../install/files/local-content.js";
import { flattenRelease, RELEASE_TIERS } from "../remote/release-options.js";
import { validateReleaseConfig } from "../remote/validate.js";
import { LocalizedError } from "../../lib/errors/localized-error.js";

export interface InspectorOptions {
  configs: readonly InstanceMainConfig[];
  resolver: ParamResolver;
  platform: GamePlatform;
  /** Racine des données du launcher (`<racine>/instances/<id>/<canal>`). */
  rootPath: () => string;
}

/** Ce que le remote déclare pour une installation, avant comparaison au disque. */
export interface LoadedInstance {
  config: InstanceMainConfig;
  locations: InstallLocations;
  release: ReleaseConfig | undefined;
  /** Erreurs de validation du latest.yml (`latest.<niveau>.<entrée>.<champ> : …`). */
  releaseErrors: string[];
  releaseSource: "online" | "cache" | "none";
  /** Espace libre minimal (Mo) exigé par l'index avant une première installation. */
  requiredSpaceMb?: number;
  mods: ModDisplay[];
  contributors: Contributor[];
  errors: string[];
}

export const TIERS: readonly ReleaseTier[] = RELEASE_TIERS;

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export class InstanceInspector {
  constructor(private readonly options: InspectorOptions) {}

  /** Charge ce que le remote déclare pour un canal (index, latest.yml, mods, contributeurs). */
  async load(id: string, channel: Channel): Promise<LoadedInstance> {
    const { configs, resolver, platform, rootPath } = this.options;
    const config = configs.find((item) => item.id === id);
    if (!config) throw new LocalizedError("err.unknownInstance", { id });

    const locations = installLocations(rootPath(), config, channel, platform);
    const errors: string[] = [];
    const loaded: LoadedInstance = {
      config,
      locations,
      release: undefined,
      releaseErrors: [],
      releaseSource: "none",
      mods: [],
      contributors: [],
      errors,
    };

    // 1. index.config.json du jeu : activation, lien du canal, mods et contributeurs.
    const load = await loadRemoteIndex(resolver, config.indexUrl, id);
    let releaseLink: string | undefined;

    if (load.kind !== "ok") {
      errors.push(...load.errors.map((error) => `index : ${error}`));
    } else {
      const { index } = load;
      if (index.enabled[platform] !== true) {
        errors.push(`instance désactivée pour la plateforme ${platform}`);
      }
      releaseLink = index.channels?.[channel];
      loaded.requiredSpaceMb = index.requiredSpaceMb;
      loaded.mods = await this.loadList<ModDisplay>(pickChannel(index.mods, channel), "mods", errors);
      loaded.contributors = await this.loadList<Contributor>(pickChannel(index.contributors, channel), "contributeurs", errors);
    }

    // 2. latest.yml du canal.
    if (!releaseLink) {
      errors.push(`le canal « ${channel} » n'est pas proposé par le remote`);
      return loaded;
    }

    try {
      const fetched = await resolver.getYaml<unknown>(releaseLink);
      loaded.releaseSource = fetched.source === "cache" ? "cache" : "online";
      // Plateforme choisie et liens de données lus, puis validation de ce qui sera réellement installé.
      const flat = await flattenRelease(fetched.value, platform, resolver, config.entryPaths);
      loaded.releaseErrors = [
        ...flat.errors,
        ...validateReleaseConfig(flat.release).errors,
      ];
      loaded.release = flat.release;
    } catch (error) {
      errors.push(`latest : ${messageOf(error)}`);
    }
    return loaded;
  }

  async report(
    id: string,
    channel: Channel,
    { verify = false, fresh = false }: { verify?: boolean; fresh?: boolean } = {},
  ): Promise<InstanceReport> {
    const loaded = await this.load(id, channel);
    const { config, locations, release, releaseErrors } = loaded;
    const settings = { ...config.defaultSettings, ...readInstanceSettings(locations.installDir) };

    const report: InstanceReport = {
      id,
      channel,
      installDir: locations.installDir,
      steamAppId: config.steamAppId,
      releaseSource: loaded.releaseSource,
      entries: [],
      summary: {
        total: 0,
        upToDate: 0,
        outdated: 0,
        notInstalled: 0,
        modified: 0,
        skipped: 0,
        invalid: 0,
        blocking: [],
        works: false,
      },
      installedCount: 0,
      mods: loaded.mods,
      contributors: loaded.contributors,
      settings,
      executable: locations.executable
        ? { path: locations.executable, exists: fs.existsSync(locations.executable) }
        : undefined,
      errors: loaded.errors,
    };

    const state = readInstallState(locations.installDir);
    // Les hash déjà calculés sont réutilisés tant que le fichier n'a pas changé (`fresh` : tout relire).
    const hashes = verify ? new HashCache(locations.installDir) : undefined;
    report.installedCount = Object.keys(state.entries).length;
    if (!release || typeof release !== "object") return finalize(report);
    report.releaseVersion = String(release.version ?? "");

    // 3. Une ligne par entrée.
    for (const tier of TIERS) {
      const entries = release[tier];
      if (!entries || typeof entries !== "object") continue;

      for (const [name, entry] of Object.entries(entries)) {
        const prefix = `latest.${tier}.${name}`;
        const entryErrors = releaseErrors
          .filter((error) => error.startsWith(`${prefix}.`) || error.startsWith(`${prefix} `))
          .map((error) => error.slice(prefix.length + 1).trim());

        const row = buildRow(name, tier, entry, entryErrors, state.entries[name], settings);

        if (verify && row.status === "up-to-date" && (entry?.type === "hash_url" || entry?.type === "steam_library")) {
          await this.verifyEntry(row, entry, locations.installDir, hashes!, fresh, release);
        }
        report.entries.push(row);
      }
    }

    // Erreurs de validation qui ne portent sur aucune entrée (version, clé inconnue…).
    for (const error of releaseErrors) {
      if (!new RegExp(`^latest\\.(${RELEASE_TIERS.join("|")})\\.[^.\\s]+`).test(error)) {
        report.errors.push(error);
      }
    }

    hashes?.save();
    return finalize(report);
  }

  private async loadList<T extends { name: string }>(
    param: unknown,
    label: string,
    errors: string[],
  ): Promise<T[]> {
    if (param === undefined) return [];
    try {
      const { value } = await this.options.resolver.getJson<unknown>(param as string | unknown[]);
      if (!Array.isArray(value)) throw new Error("tableau attendu");
      return value.filter(
        (item): item is T =>
          item !== null && typeof item === "object" && typeof (item as T).name === "string",
      );
    } catch (error) {
      errors.push(`${label} : ${messageOf(error)}`);
      return [];
    }
  }

  private async verifyEntry(
    row: EntryReport,
    entry: ReleaseEntry,
    installDir: string,
    hashes: HashCache,
    fresh: boolean,
    release: ReleaseConfig,
  ): Promise<void> {
    try {
      const content = entry.content;
      if (content === undefined || Array.isArray(content)) return;
      const manifest = await loadEntryContent<Manifest>(this.options.resolver, entry, installDir, release);
      const directory = entryDirectory(installDir, entry.path);
      const diff = await verifyManifest(directory, manifest, entry.to_ignore ?? [], (file) =>
        hashes.hash(file, { fresh }),
      );
      row.files = diff;
      if (diff.missing.length > 0 || diff.changed.length > 0) row.status = "modified";
    } catch (error) {
      row.errors.push(`vérification : ${messageOf(error)}`);
    }
  }
}

export const buildRow = (
  name: string,
  tier: ReleaseTier,
  entry: ReleaseEntry,
  entryErrors: string[],
  installed: { version: string; hash?: string; path?: string } | undefined,
  settings: Record<string, InstanceSettingValue>,
): EntryReport => {
  const optionalSetting = entry?.optional?.setting;
  const skipped = optionalSetting !== undefined && settings[optionalSetting] !== true;
  const declaredVersion = String(entry?.version ?? "");

  let status: EntryReport["status"];
  if (entryErrors.length > 0) status = "invalid";
  else if (skipped && installed) status = "outdated"; // désactivée mais encore installée : à retirer
  else if (skipped) status = "skipped";
  else if (!installed) status = "not-installed";
  else if (
    installed.version !== declaredVersion ||
    // Dossier de l'entrée changé depuis l'installation : réinstallation (sinon rien ne bouge)
    (installed.path !== undefined && installed.path !== String(entry?.path ?? "")) ||
    (entry.hash !== undefined && installed.hash !== entry.hash)
  ) {
    status = "outdated";
  } else status = "up-to-date";

  return {
    name,
    tier,
    type: String(entry?.type ?? ""),
    path: String(entry?.path ?? ""),
    declaredVersion,
    installedVersion: installed?.version,
    declaredHash: entry?.hash,
    installedHash: installed?.hash,
    status,
    optionalSetting,
    pendingRemoval: skipped && installed ? true : undefined,
    preserved: resolvePreserved(
      Array.isArray(entry?.gameFolderToPreserve) ? entry.gameFolderToPreserve : undefined,
      installed?.version,
    ),
    toIgnore: Array.isArray(entry?.to_ignore) ? entry.to_ignore : [],
    errors: entryErrors,
  };
};

const finalize = (report: InstanceReport): InstanceReport => {
  const summary = report.summary;
  summary.total = report.entries.length;

  for (const entry of report.entries) {
    switch (entry.status) {
      case "up-to-date":
        summary.upToDate++;
        break;
      case "outdated":
        summary.outdated++;
        break;
      case "not-installed":
        summary.notInstalled++;
        break;
      case "modified":
        summary.modified++;
        break;
      case "skipped":
        summary.skipped++;
        break;
      case "invalid":
        summary.invalid++;
        break;
    }
    const failing = !["up-to-date", "skipped"].includes(entry.status);
    if (failing) summary.blocking.push(entry.name);
  }

  summary.works =
    report.errors.length === 0 && summary.invalid === 0 && summary.blocking.length === 0;
  return report;
};
