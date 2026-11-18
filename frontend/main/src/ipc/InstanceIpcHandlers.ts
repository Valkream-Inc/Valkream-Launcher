/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { spawn } from "child_process";
import { ipcMain, shell } from "electron";

import type { Channel, GamePlatform, InstanceSettingValue } from "@shared/types";

import instancesConfig from "../instances/instances.config";
import { installLocations } from "../engine/instance-paths";
import { readInstanceSettings, writeInstanceSetting } from "../engine/install-store";
import { planLaunch } from "../engine/launch";
import {
  getInstanceInspector,
  getInstanceInstaller,
  getInstanceRegistry,
} from "../engine/registry-factory";
import DirsManager from "../manager/dirsManager";

const isChannel = (value: unknown): value is Channel =>
  value === "stable" || value === "beta";

const findConfig = (id: unknown) => {
  const config = instancesConfig.find((item) => item.id === id);
  if (!config) throw new Error(`Instance inconnue : ${String(id)}`);
  return config;
};

const locationsOf = (id: unknown, channel: unknown) => {
  const config = findConfig(id);
  if (!isChannel(channel)) throw new Error(`Canal invalide : ${String(channel)}`);
  return {
    config,
    locations: installLocations(
      DirsManager.rootPath(),
      config,
      channel,
      process.platform as GamePlatform
    ),
  };
};

const InstanceIpcHandlers = (): void => {
  // Le registre ne lève jamais : une instance injoignable ou invalide est décrite dans son résumé.
  ipcMain.handle("instances:list", () => getInstanceRegistry().list());

  ipcMain.handle(
    "instances:report",
    (_event, id: string, channel: Channel, options?: { verify?: boolean }) => {
      findConfig(id);
      if (!isChannel(channel)) throw new Error(`Canal invalide : ${String(channel)}`);
      return getInstanceInspector().report(id, channel, { verify: options?.verify === true });
    }
  );

  ipcMain.handle(
    "instances:set-setting",
    (_event, id: string, channel: Channel, name: string, value: InstanceSettingValue) => {
      const { locations } = locationsOf(id, channel);
      return writeInstanceSetting(locations.installDir, name, value);
    }
  );

  ipcMain.handle("instances:sync", (event, id: string, channel: Channel) => {
    locationsOf(id, channel); // valide id et canal
    return getInstanceInstaller().sync(id, channel, {
      onProgress: (progress) => {
        if (!event.sender.isDestroyed()) event.sender.send("instances:progress", progress);
      },
    });
  });

  ipcMain.handle("instances:launch", async (_event, id: string, channel: Channel) => {
    const { config, locations } = locationsOf(id, channel);

    // On ne lance jamais un jeu bloqué (base ou mise à jour cassante manquante).
    const report = await getInstanceInspector().report(id, channel);
    if (!report.summary.works) {
      throw new Error("Le jeu n'est pas à jour : installez ou mettez à jour avant de lancer");
    }

    const plan = planLaunch(config, locations, readInstanceSettings(locations.installDir));
    if (plan.kind === "steam") {
      await shell.openExternal(plan.url);
      return;
    }
    spawn(plan.path, [], { cwd: plan.cwd, detached: true, stdio: "ignore" }).unref();
  });
};

export default InstanceIpcHandlers;
