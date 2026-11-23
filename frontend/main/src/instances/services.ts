/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Assemble le registre d'instances avec les dépendances réelles du launcher
 * (réseau, cache disque, plateforme). Créé à la demande, pas au démarrage.
 */

import os from "os";
import path from "path";

import type { Channel, GamePlatform } from "@shared/types";

import { baseUrl, isDev } from "../core/constants.js";
import instancesConfig from "./instances.config.js";
import SettingsManager from "../core/settings.js";
import DirsManager from "../core/dirs.js";
import { createDiskCache } from "./remote/disk-cache.js";
import { httpFetchText } from "./remote/http-fetcher.js";
import InfosManager from "../core/server-infos.js";
import { InstanceInfos } from "./local/InstanceInfos.js";
import { InstanceInspector } from "./local/InstanceInspector.js";
import { InstanceInstaller } from "./install/InstanceInstaller.js";
import { realInstallIO } from "./install/real-io.js";
import { InstanceRegistry } from "./remote/InstanceRegistry.js";
import { ParamResolver } from "./remote/ParamResolver.js";
import { computeStatus } from "./local/status.js";

let resolver: ParamResolver | null = null;
let registry: InstanceRegistry | null = null;
let inspector: InstanceInspector | null = null;
let installer: InstanceInstaller | null = null;

const getResolver = (): ParamResolver => {
  if (!resolver) {
    resolver = new ParamResolver({
      baseUrl,
      fetchText: httpFetchText,
      cache: createDiskCache(path.join(DirsManager.dbPath(), "cache", "params")),
      allowInsecure: isDev,
    });
  }
  return resolver;
};

const platform = (): GamePlatform => os.platform() as GamePlatform;

export const getInstanceRegistry = (): InstanceRegistry => {
  registry ??= new InstanceRegistry({
    configs: instancesConfig,
    resolver: getResolver(),
    platform: platform(),
  });
  return registry;
};

export const getInstanceInspector = (): InstanceInspector => {
  inspector ??= new InstanceInspector({
    configs: instancesConfig,
    resolver: getResolver(),
    platform: platform(),
    rootPath: () => DirsManager.gamesRoot(),
  });
  return inspector;
};

export const getInstanceInstaller = (): InstanceInstaller => {
  installer ??= new InstanceInstaller({
    inspector: getInstanceInspector(),
    resolver: getResolver(),
    platform: platform(),
    io: realInstallIO,
    nexusApiKey: () => SettingsManager.getSetting("nexusApiKey"),
    language: async () => ((await SettingsManager.getSetting("language")) === "en" ? "en" : "fr"),
  });
  return installer;
};

let infos: InstanceInfos | null = null;

export const getInstanceInfos = (): InstanceInfos => {
  infos ??= new InstanceInfos({
    configs: instancesConfig,
    resolver: getResolver(),
    platform: platform(),
    queryServer: (server) => InfosManager.getServerInfos(server),
  });
  return infos;
};

/** Statut d'accueil : rapport + connexion internet / serveur de fichiers. */
export const getInstanceStatus = async (id: string, channel: Channel) => {
  const [report, isInternetConnected, isServerReachable] = await Promise.all([
    getInstanceInspector().report(id, channel),
    InfosManager.getIsInternetConnected(),
    InfosManager.getIsServerReachable(),
  ]);
  return computeStatus(report, { isInternetConnected, isServerReachable });
};
