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
  getInfos: (game) => ipcRenderer.invoke("get-infos", game),

  // utils
  openLink: (url) => ipcRenderer.invoke("open-link", url),
  getSettings: (key) => ipcRenderer.invoke("get-settings", key),
  setSettings: (key, value) => ipcRenderer.invoke("set-settings", key, value),
  openDevTools: () => ipcRenderer.invoke("main-window-open-devTools"),
  openAppData: () => ipcRenderer.invoke("open-appdata"),
  uninstallLauncher: () => ipcRenderer.invoke("uninstall-launcher"),
  chooseFolder: () => ipcRenderer.invoke("choose-folder"),
});

// Expose these window control functions to the renderer process (your React app).
// They will be available in the renderer as `window.electron_Valheim_API.install()`, `window.electron_Valheim_API.update()`, etc.
contextBridge.exposeInMainWorld("electron_Valheim_API", {
  // infos
  versionGame: () => ipcRenderer.invoke("Valheim-get-version:game"),
  getInstallationStatut: () =>
    ipcRenderer.invoke("Valheim-get-installation-statut"),

  // utils
  openGameFolder: () => ipcRenderer.invoke("Valheim-open-game-folder"),
  uninstallGame: () => ipcRenderer.invoke("Valheim-uninstall-game"),

  // mods data
  getModsData: (signal) => ipcRenderer.invoke("Valheim-get-mods-data", signal),
  getModDetails: (baseMod) =>
    ipcRenderer.invoke("Valheim-get-mods-details", baseMod),
  getHashData: () => ipcRenderer.invoke("Valheim-get-hash-data"),

  // installation
  install: () => ipcRenderer.invoke("Valheim-install"),
  onInstallProgress: (callback) =>
    ipcRenderer.on("progress-install-valheim", (event, data) => callback(data)),
  onInstallDone: (callback) =>
    ipcRenderer.on("done-install-valheim", (event, data) => callback(data)),
  onInstallError: (callback) =>
    ipcRenderer.on("error-install-valheim", (event, data) => callback(data)),
  removeInstallListeners: () => {
    ipcRenderer.removeAllListeners("progress-install-valheim");
    ipcRenderer.removeAllListeners("done-install-valheim");
    ipcRenderer.removeAllListeners("error-install-valheim");
  },

  // play
  start: () => ipcRenderer.invoke("Valheim-start"),

  // update
  update: () => ipcRenderer.invoke("update"),
  onUpdateProgress: (callback) =>
    ipcRenderer.on("progress-update-valheim", (event, data) => callback(data)),
  onUpdateDone: (callback) =>
    ipcRenderer.on("done-update-valheim", (event, data) => callback(data)),
  onUpdateError: (callback) =>
    ipcRenderer.on("error-update-valheim", (event, data) => callback(data)),
  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners("progress-update-valheim");
    ipcRenderer.removeAllListeners("done-update-valheim");
    ipcRenderer.removeAllListeners("error-update-valheim");
  },

  // custom mods
  customMods: () => ipcRenderer.invoke("Valheim-custom-mods"),
  onCustomModsProgress: (callback) =>
    ipcRenderer.on("progress-custom-mods-valheim", (event, data) =>
      callback(data)
    ),
  onCustomModsDone: (callback) =>
    ipcRenderer.on("done-custom-mods-valheim", (event, data) => callback(data)),
  onCustomModsError: (callback) =>
    ipcRenderer.on("error-custom-mods-valheim", (event, data) =>
      callback(data)
    ),
  removeCustomModsListeners: () => {
    ipcRenderer.removeAllListeners("progress-custom-mods-valheim");
    ipcRenderer.removeAllListeners("done-custom-mods-valheim");
    ipcRenderer.removeAllListeners("error-custom-mods-valheim");
  },
});

// Expose these window control functions to the renderer process (your React app).
// They will be available in the renderer as `window.electron_SevenDtoD_API.install()`, `window.electron_SevenDtoD_API.update()`, etc.
contextBridge.exposeInMainWorld("electron_SevenDtoD_API", {
  // infos
  getInstallationStatut: () =>
    ipcRenderer.invoke("SevenDtoD-get-installation-statut"),

  // mods data
  getModsData: () => ipcRenderer.invoke("SevenDtoD-get-mods-data"),
  onModsDataProgress: (callback) =>
    ipcRenderer.on("progress-mods-data-sevendtod", (event, data) =>
      callback(data)
    ),
  removeModsDataListeners: () =>
    ipcRenderer.removeAllListeners("progress-mods-data-sevendtod"),

  getLocalHashData: () => ipcRenderer.invoke("SevenDtoD-get-local-hash-data"),
});
