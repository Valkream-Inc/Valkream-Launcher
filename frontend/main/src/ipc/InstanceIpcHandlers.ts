/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { ipcMain } from "electron";

import { getInstanceRegistry } from "../engine/registry-factory";

const InstanceIpcHandlers = (): void => {
  // Le registre ne lève jamais : une instance injoignable ou invalide est décrite dans son résumé.
  ipcMain.handle("instances:list", () => getInstanceRegistry().list());
};

export default InstanceIpcHandlers;
