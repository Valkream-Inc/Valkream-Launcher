/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * IPC unique pour tous les jeux : chaque appel reçoit l'id de l'instance (et le canal).
 */

import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { BrowserWindow, dialog, ipcMain, shell } from "electron";

import type { Channel, GamePlatform, InstanceSettingValue } from "@shared/types";

import instancesConfig from "../instances/instances.config.js";
import { readInstallLog } from "../instances/install/state/install-log.js";
import { installLocations } from "../instances/local/instance-paths.js";
import { readInstanceSettings, writeInstanceSetting } from "../instances/install/state/install-store.js";
import { planLaunch } from "../instances/local/launch/launch.js";
import {
  getInstanceInfos,
  getInstanceInspector,
  getInstanceInstaller,
  getInstanceRegistry,
  getInstanceStatus,
} from "../instances/services.js";
import { isMovingGamesRoot } from "../lib/fs/games-root.js";
import DirsManager from "../core/dirs.js";
import LauncherManager from "../core/launcher.js";
import { ensureSteamRunning, isSteamRunning } from "../instances/local/steam/steam.js";
import { cancelSync, runSync } from "./sync-registry.js";
import { clearGameSourceDir, writeGameSourceDir } from "../instances/install/game-source.js";
import { DEPOT_DOWNLOADER_ASSETS, DEPOT_DOWNLOADER_VERSION } from "../instances/install/depot/depot-config.js";
import { depotAssetFor, ensureDepotDownloader } from "../instances/install/depot/depot-tool.js";
import { depotOsOf, downloadWithDepot } from "../instances/install/depot/depot-download.js";
import { realDepotRunner } from "../instances/install/depot/depot-runner.js";
import { realInstallIO } from "../instances/install/real-io.js";
import { LocalizedError } from "../lib/errors/localized-error.js";

const isChannel = (value: unknown): value is Channel =>
  value === "stable" || value === "beta" || value === "alpha";

/** Pendant le déplacement du dossier des jeux, rien ne doit lancer, installer ni modifier un jeu. */
const assertNotMoving = (): void => {
  if (isMovingGamesRoot()) throw new LocalizedError("err.rootMoving");
};

/** Valide id et canal reçus du renderer et résout les chemins de l'installation. */
const resolve = (id: unknown, channel: unknown) => {
  const config = instancesConfig.find((item) => item.id === id);
  if (!config) throw new LocalizedError("err.unknownInstance", { id: String(id) });
  if (!isChannel(channel)) throw new LocalizedError("err.invalidChannel", { channel: String(channel) });
  return {
    config,
    channel,
    locations: installLocations(
      // Dossier des jeux choisi par le joueur (et non le dossier par défaut) : sinon, après un déplacement,
      // le dossier, le journal et les réglages du jeu seraient cherchés au mauvais endroit.
      DirsManager.gamesRoot(),
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
      const { config, locations } = resolve(id, channel);
      return writeInstanceSetting(locations.installDir, name, value, config.defaultSettings);
    }
  );

  // Une synchronisation annulable par canal (clé = dossier d'installation) : relancer en remplace une bloquée.
  ipcMain.handle("instances:sync", (event, id: string, channel: Channel, options?: { repair?: boolean }) => {
    assertNotMoving();
    const { locations } = resolve(id, channel);
    return runSync(locations.installDir, (signal) =>
      getInstanceInstaller().sync(id, channel, {
        repair: options?.repair === true,
        signal,
        onProgress: (progress) => {
          if (!event.sender.isDestroyed()) event.sender.send("instances:progress", progress);
        },
      })
    );
  });

  // Journal d'installation du canal (texte), pour le support.
  ipcMain.handle("instances:log", (_event, id: string, channel: Channel) => {
    const { locations } = resolve(id, channel);
    return readInstallLog(locations.installDir);
  });

  ipcMain.handle("instances:cancel", (_event, id: string, channel: Channel) => {
    const { locations } = resolve(id, channel);
    cancelSync(locations.installDir);
  });

  ipcMain.handle("instances:launch", async (_event, id: string, channel: Channel) => {
    assertNotMoving();
    const { config, locations } = resolve(id, channel);

    // On ne lance jamais un jeu dont une partie bloquante manque (sauf hors ligne : on joue l'installé).
    const status = await getInstanceStatus(id, channel);
    if (!status.canPlay) {
      throw new LocalizedError("err.notUpToDate");
    }

    const settings = { ...config.defaultSettings, ...readInstanceSettings(locations.installDir) };
    const behavior = settings.launcherBehavior;
    const plan = planLaunch(config, locations, settings);

    // `launchSteam` : Steam doit tourner pour la vérification de possession du jeu.
    if (plan.kind === "executable" && plan.ensureSteam) {
      const result = await ensureSteamRunning({
        isRunning: () => isSteamRunning(),
        open: (url) => shell.openExternal(url),
        sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      });
      if (result === "timeout") console.warn("⚠️ Steam ne répond pas : lancement du jeu sans attendre.");
    }

    if (plan.kind === "steam") {
      await shell.openExternal(plan.url);
      if (behavior === "close") LauncherManager.close();
      return;
    }

    const child = spawn(plan.path, plan.args, { cwd: plan.cwd, stdio: "ignore", detached: behavior !== "hide" });
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
    if (!fs.existsSync(locations.installDir)) throw new LocalizedError("err.gameDirMissing");
    const error = await shell.openPath(locations.installDir);
    if (error) throw new Error(error);
  });

  // Solution « localiser l'installation » : le joueur choisit le dossier du jeu (lu, jamais modifié).
  ipcMain.handle("instances:pick-source", async (event, id: string, channel: Channel) => {
    assertNotMoving();
    const { locations } = resolve(id, channel);
    const window = BrowserWindow.fromWebContents(event.sender);
    const options = { title: "Dossier d'installation du jeu", properties: ["openDirectory" as const] };
    const result = window ? await dialog.showOpenDialog(window, options) : await dialog.showOpenDialog(options);
    if (result.canceled || result.filePaths.length === 0) return null;
    writeGameSourceDir(locations.installDir, result.filePaths[0]);
    return result.filePaths[0];
  });

  ipcMain.handle("instances:clear-source", (_event, id: string, channel: Channel) => {
    assertNotMoving();
    clearGameSourceDir(resolve(id, channel).locations.installDir);
  });

  // Solution « DepotDownloader » : la version exacte du jeu, connexion par QR code.
  // La sortie (QR code inclus) est envoyée ligne à ligne à l'interface.
  ipcMain.handle("instances:depot-download", async (event, id: string, channel: Channel) => {
    assertNotMoving();
    const { config, locations } = resolve(id, channel);
    const { release } = await getInstanceInspector().load(id, channel);
    const entry = [...Object.values(release?.["game-base"] ?? {}), ...Object.values(release?.["game-details"] ?? {})].find(
      (item) => item.type === "steam_library" && item.depot !== undefined
    );
    if (!entry?.depot || config.steamAppId === undefined) throw new LocalizedError("err.noDepot");

    const platformKey = `${process.platform}-${os.arch()}`;
    if (!depotAssetFor(DEPOT_DOWNLOADER_ASSETS, platformKey)) {
      throw new LocalizedError("err.depotUnavailable");
    }
    const send = (payload: { line?: string; percent?: number }) => {
      if (!event.sender.isDestroyed()) event.sender.send("instances:depot-output", { id, channel, ...payload });
    };
    return runSync(`${locations.installDir}#depot`, async (signal) => {
      send({ line: "Préparation de DepotDownloader…" });
      const tool = await ensureDepotDownloader({
        toolsDir: path.join(DirsManager.rootPath(), "tools"),
        platformKey,
        assets: DEPOT_DOWNLOADER_ASSETS,
        io: realInstallIO,
        signal,
        onProgress: (percent) => send({ percent }),
      });
      const dir = await downloadWithDepot({
        tool,
        runner: realDepotRunner,
        appId: config.steamAppId as number,
        depot: entry.depot as NonNullable<typeof entry.depot>,
        installDir: locations.installDir,
        os: depotOsOf(process.platform),
        signal,
        onLine: (line) => send({ line }),
        onPercent: (percent) => send({ percent }),
      });
      writeGameSourceDir(locations.installDir, dir);
      return dir;
    });
  });

  // Écran d'information affiché avant la première utilisation de DepotDownloader.
  ipcMain.handle("instances:depot-info", (_event, id: string, channel: Channel) => {
    const { locations } = resolve(id, channel);
    return {
      version: DEPOT_DOWNLOADER_VERSION,
      toolsDir: path.join(DirsManager.rootPath(), "tools", "depotdownloader"),
      downloadDir: path.join(locations.installDir, ".depot"),
      sourceUrl: "https://github.com/SteamRE/DepotDownloader",
    };
  });

  ipcMain.handle("instances:depot-cancel", (_event, id: string, channel: Channel) => {
    cancelSync(`${resolve(id, channel).locations.installDir}#depot`);
  });

  ipcMain.handle("instances:uninstall", (_event, id: string, channel: Channel) => {
    assertNotMoving();
    const { locations } = resolve(id, channel);
    if (getInstanceInstaller().isBusy(locations.installDir)) {
      throw new LocalizedError("install.alreadyRunning");
    }
    // Un seul canal est supprimé : l'autre (stable/beta) n'est jamais touché.
    fs.rmSync(locations.installDir, { recursive: true, force: true });
  });
};

export default InstanceIpcHandlers;
