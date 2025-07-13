/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { app, ipcMain } = require("electron");

const path = require("path");
const fs = require("fs");

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

    // Configuration du repertoir pour la base de données
    if (dev) {
      let appPath = path.resolve("./data/Launcher").replace(/\\/g, "/");
      if (!fs.existsSync(appPath)) fs.mkdirSync(appPath, { recursive: true });
      app.setPath("userData", appPath);
      return MainWindow.createWindow();
    } else UpdateWindow.createWindow();
  });
}
