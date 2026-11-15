/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { app, session } = require("electron");
const path = require("path");
const fse = require("fs-extra");

const UpdateWindow = require("./src/windows/updateWindow.js");
const MainWindow = require("./src/windows/mainWindow.js");
const IpcHandlers = require("./src/ipc/ipcHandlers.js");

const isDev = process.env.NODE_ENV === "dev";

if (process.platform === "win32") app.setAppUserModelId("Valkream-Launcher");

// Pour garder les parformances quand l'app est en arrière plan
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");

if (!app.requestSingleInstanceLock() && !isDev) app.quit();
else {
  app.whenReady().then(async () => {
    // Supprimer le dossier data si il existe et que le mode de développement n'est pas activé (ancienne version)
    try {
      if (!isDev) {
        const oldDataPath = path.join(
          app.getPath("appData"),
          ".valkream-launcher-data"
        );
        const oldDirExists = await fse.pathExists(oldDataPath);

        if (oldDirExists) {
          await fse.remove(oldDataPath);
          console.log(`Nettoyage réussi : suppression de ${oldDataPath}.`);
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de la suppresion de l'ancien dossier de données:",
        error
      );
    }

    // ⚙️ Initialisation des handlers IPC
    const ipcHandlers = new IpcHandlers();
    ipcHandlers.init();

    // 🪟 Lancement de la fenêtre principale
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
