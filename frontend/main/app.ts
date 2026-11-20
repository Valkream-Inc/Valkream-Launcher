/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { app } from "electron";

import * as UpdateWindow from "./src/windows/updateWindow";
import * as MainWindow from "./src/windows/mainWindow";
import IpcHandlers from "./src/ipc/launcher-ipc";
import { isDev } from "./src/core/constants";
import { abortAllSyncs } from "./src/ipc/sync-registry";

if (process.platform === "win32") app.setAppUserModelId("Valkream-Launcher");

// Pour garder les parformances quand l'app est en arrière plan
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");

if (!app.requestSingleInstanceLock() && !isDev) app.quit();
else {
  app.whenReady().then(async () => {
    // ⚙️ Initialisation des handlers IPC
    const ipcHandlers = new IpcHandlers();
    ipcHandlers.init();

    // 🪟 Lancement de la fenêtre principale
    if (isDev) return MainWindow.createWindow();
    else UpdateWindow.createWindow();
  });
}

// Fermeture ou erreur fatale : on coupe les installations en cours (les partiels restent reprenables)
app.on("before-quit", abortAllSyncs);
process.on("uncaughtException", (error) => {
  console.error("❌ Erreur non gérée :", error);
  abortAllSyncs();
});
process.on("unhandledRejection", (reason) => {
  console.error("❌ Promesse rejetée non gérée :", reason);
  abortAllSyncs();
});

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
