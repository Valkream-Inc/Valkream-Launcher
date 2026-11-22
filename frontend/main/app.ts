/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { app } from "electron";

import * as UpdateWindow from "./src/windows/updateWindow.js";
import * as MainWindow from "./src/windows/mainWindow.js";
import IpcHandlers from "./src/ipc/launcher-ipc.js";
import { isDev } from "./src/core/constants.js";
import path from "path";
import DirsManager from "./src/core/dirs.js";
import LauncherManager from "./src/core/launcher.js";
import { cleanupInterruptedMove, INSTANCES_DIR } from "./src/lib/games-root.js";
import { applyLauncherVersion } from "./src/lib/launcher-version.js";
import { abortAllSyncs } from "./src/ipc/sync-registry.js";

if (process.platform === "win32") app.setAppUserModelId("Valkream-Launcher");

// Pour garder les parformances quand l'app est en arrière plan
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");

if (!app.requestSingleInstanceLock() && !isDev) app.quit();
else {
  app.whenReady().then(async () => {
    // Dossier des jeux : restes d'un déplacement interrompu, puis nettoyage si le launcher change de version majeure
    try {
      cleanupInterruptedMove(DirsManager.gamesRoot());
      if (!isDev) {
        const { change, cleaned } = applyLauncherVersion({
          versionFile: DirsManager.versionFile(),
          instancesDir: path.join(DirsManager.gamesRoot(), INSTANCES_DIR),
          current: LauncherManager.getVersion(),
        });
        if (change === "major") console.log(`🧹 Nouvelle version majeure : ${cleaned.length} installation(s) nettoyée(s)`);
      }
    } catch (error) {
      console.error("Nettoyage au démarrage impossible :", error);
    }

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
