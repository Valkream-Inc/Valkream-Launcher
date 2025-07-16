/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { app } = require("electron");

const UpdateWindow = require("./main/windows/updateWindow.js");
const MainWindow = require("./main/windows/mainWindow.js");
const IpcHandlers = require("./main/ipc/ipcHandlers.js");

let dev = process.env.NODE_ENV === "dev";

if (process.platform === "win32") app.setAppUserModelId("Valkream-Launcher");
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.whenReady().then(() => {
    // Initialisation des handlers IPC
    const ipcHandlers = new IpcHandlers();
    ipcHandlers.init();

    // Démarrage de la fenêtre principale
    if (dev) return MainWindow.createWindow();
    else UpdateWindow.createWindow();
  });
}
