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
  checkForUpdates: () => ipcRenderer.send("check-for-updates"),
  onUpdateStatus: (callback) => {
    ipcRenderer.on("update_status", (_event, message) => callback(message));
  },

  onLaunchMainWindow: (callback) =>
    ipcRenderer.on("launch_main_window", callback),
  closeUpdateWindow: () => ipcRenderer.send("update-window-close"),
  openMainWindow: () => ipcRenderer.send("main-window-open"),
});
