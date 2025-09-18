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
const { contextBridge, ipcRenderer } = require("electron");

// Expose these window control functions to the renderer process (your React app).
// They will be available in the renderer as `window.electron_API.close()`, `window.electron_API.minimize()`, etc.
contextBridge.exposeInMainWorld("electron_API", {
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
    ipcRenderer.on("on-maximize", (event, ...args) => callback(...args)),
  onUnmaximize: (callback) =>
    ipcRenderer.on("on-unmaximize", (event, ...args) => callback(...args)),
  removeOnMaximize: (callback) =>
    ipcRenderer.removeListener("on-maximize", callback),
  removeOnUnmaximize: (callback) =>
    ipcRenderer.removeListener("on-unmaximize", callback),

  // infos
  versionLauncher: () => ipcRenderer.invoke("get-version:launcher"),
  versionGame: () => ipcRenderer.invoke("get-version:game"),
  getInfos: (game) => ipcRenderer.invoke("get-infos", game),
  getInstallationStatut: () => ipcRenderer.invoke("get-installation-statut"),

  // utils
  openLink: (url) => ipcRenderer.invoke("open-link", url),
  getSettings: (key) => ipcRenderer.invoke("get-settings", key),
  setSettings: (key, value) => ipcRenderer.invoke("set-settings", key, value),
  openDevTools: () => ipcRenderer.invoke("main-window-open-devTools"),
  openAppData: () => ipcRenderer.invoke("open-appdata"),
  openGameFolder: () => ipcRenderer.invoke("open-game-folder"),
  uninstallGame: () => ipcRenderer.invoke("uninstall-game"),
  uninstallLauncher: () => ipcRenderer.invoke("uninstall-launcher"),

  // mods data
  getModsData: (signal) => ipcRenderer.invoke("get-mods-data", signal),
  getModDetails: (baseMod) => ipcRenderer.invoke("get-mods-details", baseMod),
  getHashData: () => ipcRenderer.invoke("get-hash-data"),

  // installation
  install: () => ipcRenderer.invoke("install"),
  onInstallProgress: (callback) =>
    ipcRenderer.on("progress-install", (event, data) => callback(data)),
  onInstallDone: (callback) =>
    ipcRenderer.on("done-install", (event, data) => callback(data)),
  onInstallError: (callback) =>
    ipcRenderer.on("error-install", (event, data) => callback(data)),
  removeInstallListeners: () => {
    ipcRenderer.removeAllListeners("progress-install");
    ipcRenderer.removeAllListeners("done-install");
    ipcRenderer.removeAllListeners("error-install");
  },

  // play
  start: () => ipcRenderer.invoke("start"),

  // update
  update: () => ipcRenderer.invoke("update"),
  onUpdateProgress: (callback) =>
    ipcRenderer.on("progress-update", (event, data) => callback(data)),
  onUpdateDone: (callback) =>
    ipcRenderer.on("done-update", (event, data) => callback(data)),
  onUpdateError: (callback) =>
    ipcRenderer.on("error-update", (event, data) => callback(data)),
  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners("progress-update");
    ipcRenderer.removeAllListeners("done-update");
    ipcRenderer.removeAllListeners("error-update");
  },

  // custom mods
  customMods: () => ipcRenderer.invoke("custom-mods"),
  onCustomModsProgress: (callback) =>
    ipcRenderer.on("progress-custom-mods", (event, data) => callback(data)),
  onCustomModsDone: (callback) =>
    ipcRenderer.on("done-custom-mods", (event, data) => callback(data)),
  onCustomModsError: (callback) =>
    ipcRenderer.on("error-custom-mods", (event, data) => callback(data)),
  removeCustomModsListeners: () => {
    ipcRenderer.removeAllListeners("progress-custom-mods");
    ipcRenderer.removeAllListeners("done-custom-mods");
    ipcRenderer.removeAllListeners("error-custom-mods");
  },
});
