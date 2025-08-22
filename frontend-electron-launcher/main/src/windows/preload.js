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
  /**
   * Sends a message to the main process to close the main window and quit the app.
   */
  close: () => {
    // Send a message to the main process
    ipcRenderer.send("main-window-close");
    ipcRenderer.send("app-quit");
  },

  /**
   * Sends a message to the main process to minimize the main window.
   */
  minimize: () => {
    // Send a message to the main process
    ipcRenderer.send("main-window-minimize");
  },

  /**
   * Sends a message to the main process to maximize or restore the main window.
   */
  maximize: () => {
    // Send a message to the main process
    ipcRenderer.send("main-window-maximize");
  },

  /**
   * Allows the renderer process to get the current window maximization state.
   */
  isMaximized: () => ipcRenderer.invoke("get-is-maximized"),

  /**
   * Allows the renderer process to listen for 'maximize' events.
   */
  onMaximize: (callback) =>
    ipcRenderer.on("on-maximize", (event, ...args) => callback(...args)),

  /**
   * Allows the renderer process to listen for 'unmaximize' events.
   */
  onUnmaximize: (callback) =>
    ipcRenderer.on("on-unmaximize", (event, ...args) => callback(...args)),

  /**
   * Removes the listener for the 'maximize' event.
   */
  removeOnMaximize: (callback) =>
    ipcRenderer.removeListener("on-maximize", callback),

  /**
   * Removes the listener for the 'unmaximize' event.
   */
  removeOnUnmaximize: (callback) =>
    ipcRenderer.removeListener("on-unmaximize", callback),
});
