/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Assemble le registre d'instances avec les dépendances réelles du launcher
 * (réseau, cache disque, plateforme). Créé à la demande, pas au démarrage.
 */

import os from "os";
import path from "path";

import type { GamePlatform } from "@shared/types";

import baseUrl from "../constants/baseUrl";
import isDev from "../constants/isDev";
import instancesConfig from "../instances/instances.config";
import DirsManager from "../manager/dirsManager";
import { createDiskCache } from "./disk-cache";
import { httpFetchText } from "./http-fetcher";
import { InstanceInspector } from "./InstanceInspector";
import { InstanceRegistry } from "./InstanceRegistry";
import { ParamResolver } from "./ParamResolver";

let resolver: ParamResolver | null = null;
let registry: InstanceRegistry | null = null;
let inspector: InstanceInspector | null = null;

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
    rootPath: () => DirsManager.rootPath(),
  });
  return inspector;
};
