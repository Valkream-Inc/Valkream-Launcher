/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * IPC unique pour tous les jeux : chaque appel reçoit l'id de l'instance (et le canal).
 */

import { spawn } from "child_process";
import fs from "fs";
import { ipcMain, shell } from "electron";

import type { Channel, GamePlatform, InstanceSettingValue } from "@shared/types";

import instancesConfig from "../instances/instances.config";
import { installLocations } from "../engine/instance-paths";
import { readInstanceSettings, writeInstanceSetting } from "../engine/install-store";
import { planLaunch } from "../engine/launch";
import {
  getInstanceInfos,
  getInstanceInspector,
  getInstanceInstaller,
  getInstanceRegistry,
  getInstanceStatus,
} from "../engine/registry-factory";
import DirsManager from "../manager/dirsManager";
import LauncherManager from "../manager/launcherManager";

const isChannel = (value: unknown): value is Channel =>
  value === "stable" || value === "beta";

/** Valide id et canal reçus du renderer et résout les chemins de l'installation. */
const resolve = (id: unknown, channel: unknown) => {
  const config = instancesConfig.find((item) => item.id === id);
  if (!config) throw new Error(`Instance inconnue : ${String(id)}`);
  if (!isChannel(channel)) throw new Error(`Canal invalide : ${String(channel)}`);
  return {
    config,
    channel,
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

  // Serveur de jeu, événement et maintenance.
  ipcMain.handle("instances:infos", (_event, id: string) => {
    resolve(id, "stable");
    return getInstanceInfos().get(id);
  });

  ipcMain.handle("instances:status", (_event, id: string, channel: Channel) => {
    resolve(id, channel);
    return getInstanceStatus(id, channel);
  });

  ipcMain.handle(
    "instances:report",
    (_event, id: string, channel: Channel, options?: { verify?: boolean }) => {
      resolve(id, channel);
      return getInstanceInspector().report(id, channel, { verify: options?.verify === true });
    }
  );

  ipcMain.handle(
    "instances:set-setting",
    (_event, id: string, channel: Channel, name: string, value: InstanceSettingValue) => {
      const { locations } = resolve(id, channel);
      return writeInstanceSetting(locations.installDir, name, value);
    }
  );

  ipcMain.handle("instances:sync", (event, id: string, channel: Channel, options?: { repair?: boolean }) => {
    resolve(id, channel);
    return getInstanceInstaller().sync(id, channel, {
      repair: options?.repair === true,
      onProgress: (progress) => {
        if (!event.sender.isDestroyed()) event.sender.send("instances:progress", progress);
      },
    });
  });

  ipcMain.handle("instances:launch", async (_event, id: string, channel: Channel) => {
    const { config, locations } = resolve(id, channel);

    // On ne lance jamais un jeu dont une partie bloquante manque (sauf hors ligne : on joue l'installé).
    const status = await getInstanceStatus(id, channel);
    if (!status.canPlay) {
      throw new Error("Le jeu n'est pas à jour : installez ou mettez à jour avant de lancer");
    }

    const settings = { ...config.defaultSettings, ...readInstanceSettings(locations.installDir) };
    const behavior = settings.launcherBehavior;
    const plan = planLaunch(config, locations, settings);

    if (plan.kind === "steam") {
      await shell.openExternal(plan.url);
      if (behavior === "close") LauncherManager.close();
      return;
    }

    const child = spawn(plan.path, [], { cwd: plan.cwd, stdio: "ignore", detached: behavior !== "hide" });
    if (behavior === "hide") {
      // Le launcher revient quand le jeu se ferme.
      LauncherManager.hide();
      await new Promise<void>((done) => {
        child.once("error", () => done());
        child.once("exit", () => done());
      });
      LauncherManager.show();
      return;
    }
    child.unref();
    if (behavior === "close") LauncherManager.close();
  });

  ipcMain.handle("instances:open-folder", async (_event, id: string, channel: Channel) => {
    const { locations } = resolve(id, channel);
    if (!fs.existsSync(locations.installDir)) throw new Error("Le dossier du jeu n'existe pas !");
    const error = await shell.openPath(locations.installDir);
    if (error) throw new Error(error);
  });

  ipcMain.handle("instances:uninstall", (_event, id: string, channel: Channel) => {
    const { locations } = resolve(id, channel);
    if (getInstanceInstaller().isBusy(locations.installDir)) {
      throw new Error("Une installation est en cours");
    }
    // Un seul canal est supprimé : l'autre (stable/beta) n'est jamais touché.
    fs.rmSync(locations.installDir, { recursive: true, force: true });
  });
};

export default InstanceIpcHandlers;
