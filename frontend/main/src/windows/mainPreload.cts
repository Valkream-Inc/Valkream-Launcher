/**
 * preload.js
 * * This script runs before the renderer process (your React app) is loaded in the browser window.
 * It has access to both Node.js APIs and browser APIs, but it's isolated from the main window's global scope.
 * We use `contextBridge` to securely expose specific functions to the main window's global `window` object.
 *
 * This approach is crucial for security. We avoid setting `nodeIntegration: true` for the renderer,
 * which would give your web app full access to the Node.js environment. Instead, we only expose
 * the functions we explicitly allow.
 */
import { contextBridge, ipcRenderer } from "electron";

import type { ElectronAPI } from "@shared/types";

// Expose these window control functions to the renderer process (your React app).
// They will be available in the renderer as `window.electron_API.close()`, `window.electron_API.minimize()`, etc.
const electronAPI: ElectronAPI = {
  // general
  close: () => {
    ipcRenderer.send("main-window-close");
    ipcRenderer.send("app-quit");
  },

  // main windows
  minimize: () => ipcRenderer.send("main-window-minimize"),
  maximize: () => ipcRenderer.send("main-window-maximize"),
  isMaximized: () => ipcRenderer.invoke("get-is-maximized"),
  onMaximize: (callback) =>
    ipcRenderer.on("on-maximize", () => callback()),
  onUnmaximize: (callback) =>
    ipcRenderer.on("on-unmaximize", () => callback()),
  removeOnMaximize: (callback) =>
    ipcRenderer.removeListener("on-maximize", callback),
  removeOnUnmaximize: (callback) =>
    ipcRenderer.removeListener("on-unmaximize", callback),

  // infos
  versionLauncher: () => ipcRenderer.invoke("get-version:launcher"),

  // jeux : une seule API pour toutes les instances
  getInstances: () => ipcRenderer.invoke("instances:list"),
  getInstanceInfos: (id) => ipcRenderer.invoke("instances:infos", id),
  getInstanceStatus: (id, channel) =>
    ipcRenderer.invoke("instances:status", id, channel),
  getInstanceReport: (id, channel, options) =>
    ipcRenderer.invoke("instances:report", id, channel, options),
  syncInstance: (id, channel, options) =>
    ipcRenderer.invoke("instances:sync", id, channel, options),
  // outils admin
  toolsHashFolder: (ignore) => ipcRenderer.invoke("tools:hash-folder", ignore),
  toolsExportHash: (ignore) => ipcRenderer.invoke("tools:export-hash", ignore),
  toolsModsList: (source, apiUrl, key) => ipcRenderer.invoke("tools:mods-list", source, apiUrl, key),
  toolsOpenTextFile: () => ipcRenderer.invoke("tools:open-text-file"),
  onToolsProgress: (callback) => ipcRenderer.on("tools:progress", (_event, data) => callback(data)),
  removeToolsProgressListeners: () => ipcRenderer.removeAllListeners("tools:progress"),
  toolsSaveText: (defaultName, text) => ipcRenderer.invoke("tools:save-text", defaultName, text),
  getInstanceLog: (id, channel) => ipcRenderer.invoke("instances:log", id, channel),
  cancelInstanceSync: (id, channel) => ipcRenderer.invoke("instances:cancel", id, channel),
  launchInstance: (id, channel) => ipcRenderer.invoke("instances:launch", id, channel),
  openInstanceFolder: (id, channel) =>
    ipcRenderer.invoke("instances:open-folder", id, channel),
  uninstallInstance: (id, channel) =>
    ipcRenderer.invoke("instances:uninstall", id, channel),
  onInstanceProgress: (callback) =>
    ipcRenderer.on("instances:progress", (_event, data) => callback(data)),
  removeInstanceProgressListeners: () =>
    ipcRenderer.removeAllListeners("instances:progress"),
  pickInstanceSource: (id, channel) => ipcRenderer.invoke("instances:pick-source", id, channel),
  clearInstanceSource: (id, channel) => ipcRenderer.invoke("instances:clear-source", id, channel),
  depotDownloadInstance: (id, channel) => ipcRenderer.invoke("instances:depot-download", id, channel),
  getDepotInfo: (id, channel) => ipcRenderer.invoke("instances:depot-info", id, channel),
  cancelDepotDownload: (id, channel) => ipcRenderer.invoke("instances:depot-cancel", id, channel),
  onDepotOutput: (callback) => ipcRenderer.on("instances:depot-output", (_event, data) => callback(data)),
  removeDepotOutputListeners: () => ipcRenderer.removeAllListeners("instances:depot-output"),
  setInstanceSetting: (id, channel, name, value) =>
    ipcRenderer.invoke("instances:set-setting", id, channel, name, value),

  // utils
  openLink: (url) => ipcRenderer.invoke("open-link", url),
  getSettings: (key) => ipcRenderer.invoke("get-settings", key),
  setSettings: (key, value) => ipcRenderer.invoke("set-settings", key, value),
  openDevTools: () => ipcRenderer.invoke("main-window-open-devTools"),
  openAppData: () => ipcRenderer.invoke("open-appdata"),
  uninstallLauncher: () => ipcRenderer.invoke("uninstall-launcher"),
  getGamesRoot: () => ipcRenderer.invoke("games-root:get"),
  changeGamesRoot: () => ipcRenderer.invoke("games-root:change"),
  resetGamesRoot: () => ipcRenderer.invoke("games-root:reset"),
  chooseFolder: () => ipcRenderer.invoke("choose-folder"),
};

contextBridge.exposeInMainWorld("electron_API", electronAPI);
