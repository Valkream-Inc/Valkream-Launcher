/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { app, session } = require("electron");

const UpdateWindow = require("./src/windows/updateWindow.js");
const MainWindow = require("./src/windows/mainWindow.js");
const IpcHandlers = require("./src/ipc/ipcHandlers.js");

let dev = process.env.NODE_ENV === "dev";

if (process.platform === "win32") app.setAppUserModelId("Valkream-Launcher");
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.whenReady().then(async () => {
    // Vider le cache Chromium au démarrage
    await session.defaultSession.clearCache();

    // Désactiver le cache pour toutes les requêtes HTTP
    session.defaultSession.webRequest.onBeforeSendHeaders(
      (details, callback) => {
        details.requestHeaders["Cache-Control"] =
          "no-cache, no-store, must-revalidate";
        details.requestHeaders["Pragma"] = "no-cache";
        callback({ cancel: false, requestHeaders: details.requestHeaders });
      }
    );

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      // Supprimer tout header de cache venant du serveur
      const headers = details.responseHeaders;
      delete headers["Cache-Control"];
      delete headers["cache-control"];
      delete headers["Expires"];
      delete headers["expires"];
      delete headers["Pragma"];
      delete headers["pragma"];

      callback({ cancel: false, responseHeaders: headers });
    });

    // Initialisation des handlers IPC
    const ipcHandlers = new IpcHandlers();
    ipcHandlers.init();

    // Démarrage de la fenêtre principale
    if (dev) return MainWindow.createWindow();
    else UpdateWindow.createWindow();
  });
}

// Quitte l'application quand toutes les fenêtres sont fermées (sauf macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// macOS : recrée une fenêtre si aucune fenêtre n'est ouverte lors du clic sur l'icône du dock
app.on("activate", () => {
  if (!MainWindow.isWindowOpen()) {
    if (dev) MainWindow.createWindow();
    else UpdateWindow.createWindow();
  }
});
