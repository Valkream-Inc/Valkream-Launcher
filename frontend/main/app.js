/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { app, session } = require("electron");
const path = require("path");
const fs = require("fs");

const UpdateWindow = require("./src/windows/updateWindow.js");
const MainWindow = require("./src/windows/mainWindow.js");
const IpcHandlers = require("./src/ipc/ipcHandlers.js");

const isDev = process.env.NODE_ENV === "dev";

if (process.platform === "win32") app.setAppUserModelId("Valkream-Launcher");
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");

if (!app.requestSingleInstanceLock() && !isDev) app.quit();
else {
  app.whenReady().then(async () => {
    // Supprimer le dossier data si il existe et que le mode de développement n'est pas activé (ancienne version)
    if (
      fs.existsSync(
        path.join(app.getPath("appData"), ".valkream-launcher-data")
      ) &&
      !isDev
    ) {
      fs.rmSync(path.join(app.getPath("appData"), "Valkream-Launcher"), {
        recursive: true,
      });
    }

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
    if (isDev) return MainWindow.createWindow();
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
    if (isDev) MainWindow.createWindow();
    else UpdateWindow.createWindow();
  }
});
