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
  close: () => {
    ipcRenderer.send("main-window-close");
    ipcRenderer.send("app-quit");
  },
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

  versionLauncher: () => ipcRenderer.invoke("get-version:launcher"),
  versionGame: () => ipcRenderer.invoke("get-version:game"),
  checkInfos: () => ipcRenderer.invoke("check-infos"),
  onUpdateInfos: (callback) =>
    ipcRenderer.on("update-infos", (event, ...args) => callback(...args)),
  removeUpdateInfos: (callback) => ipcRenderer.off("update-infos", callback),

  getInstallationStatut: () => ipcRenderer.invoke("get-installation-statut"),
  openLink: (url) => ipcRenderer.invoke("open-link", url),
  reload: () => ipcRenderer.invoke("reload"),
  getSettings: (key) => ipcRenderer.invoke("get-settings", key),
  setSettings: (key, value) => ipcRenderer.invoke("set-settings", key, value),
  // chooseFolder: () => ipcRenderer.invoke("choose-folder"),
  openDevTools: () => ipcRenderer.invoke("main-window-open-devTools"),
  openAppData: () => ipcRenderer.invoke("open-appdata"),
  openGameFolder: () => ipcRenderer.invoke("open-game-folder"),
  uninstallGame: () => ipcRenderer.invoke("uninstall-game"),
  uninstallLauncher: () => ipcRenderer.invoke("uninstall-launcher"),

  getModsData: (signal) => ipcRenderer.invoke("get-mods-data", signal),
  getModDetails: (baseMod) => ipcRenderer.invoke("get-mods-details", baseMod),
  getHashData: () => ipcRenderer.invoke("get-hash-data"),
});
