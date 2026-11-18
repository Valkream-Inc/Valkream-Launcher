/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { ipcMain } from "electron";

import type { Channel, InstanceSettingValue } from "@shared/types";

import instancesConfig from "../instances/instances.config";
import { installLocations } from "../engine/instance-paths";
import { writeInstanceSetting } from "../engine/install-store";
import {
  getInstanceInspector,
  getInstanceRegistry,
} from "../engine/registry-factory";
import DirsManager from "../manager/dirsManager";

const isChannel = (value: unknown): value is Channel =>
  value === "stable" || value === "beta";

const InstanceIpcHandlers = (): void => {
  // Le registre ne lève jamais : une instance injoignable ou invalide est décrite dans son résumé.
  ipcMain.handle("instances:list", () => getInstanceRegistry().list());

  ipcMain.handle(
    "instances:report",
    (_event, id: string, channel: Channel, options?: { verify?: boolean }) => {
      if (!isChannel(channel)) throw new Error(`Canal invalide : ${String(channel)}`);
      return getInstanceInspector().report(id, channel, { verify: options?.verify === true });
    }
  );

  ipcMain.handle(
    "instances:set-setting",
    (_event, id: string, channel: Channel, name: string, value: InstanceSettingValue) => {
      const config = instancesConfig.find((item) => item.id === id);
      if (!config) throw new Error(`Instance inconnue : ${String(id)}`);
      if (!isChannel(channel)) throw new Error(`Canal invalide : ${String(channel)}`);
      const { installDir } = installLocations(
        DirsManager.rootPath(),
        config,
        channel,
        process.platform as "win32" | "linux" | "darwin"
      );
      return writeInstanceSetting(installDir, name, value);
    }
  );
};

export default InstanceIpcHandlers;
