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
import { InstanceRegistry } from "./InstanceRegistry";
import { ParamResolver } from "./ParamResolver";

let registry: InstanceRegistry | null = null;

export const getInstanceRegistry = (): InstanceRegistry => {
  if (!registry) {
    const resolver = new ParamResolver({
      baseUrl,
      fetchText: httpFetchText,
      cache: createDiskCache(path.join(DirsManager.dbPath(), "cache", "params")),
      allowInsecure: isDev,
    });

    registry = new InstanceRegistry({
      configs: instancesConfig,
      resolver,
      platform: os.platform() as GamePlatform,
    });
  }
  return registry;
};
