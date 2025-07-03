/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { app, ipcMain } = require("electron");
const MainWindow = require("./mainWindow.js");
const path = require("path");
const fs = require("fs");

const dev = process.env.NODE_ENV === "dev";

if (process.platform === "win32") app.setAppUserModelId("Updater-UI");
if (!app.requestSingleInstanceLock()) app.quit();
else
  app.whenReady().then(() => {
    MainWindow.createWindow();
    MainWindow.getWindow().webContents.openDevTools({ mode: "detach" });
  });

// Configuration du repertoir pour la base de données
if (dev) {
  let appPath = path.resolve("./data/Launcher").replace(/\\/g, "/");
  if (!fs.existsSync(appPath)) fs.mkdirSync(appPath, { recursive: true });
  app.setPath("userData", appPath);
}
ipcMain.handle("path-user-data", () => app.getPath("userData"));

// windows
ipcMain.on("main-window-open", () => MainWindow.createWindow());
ipcMain.on("main-window-close", () => MainWindow.destroyWindow());
ipcMain.on("main-window-reload", () => MainWindow.getWindow().reload());
ipcMain.on("main-window-minimize", () => MainWindow.getWindow().minimize());
ipcMain.on("main-window-hide", () => MainWindow.getWindow().hide());
ipcMain.on("main-window-show", () => MainWindow.getWindow().show());
ipcMain.on("main-window-maximize", () => {
  if (MainWindow.getWindow().isMaximized()) {
    MainWindow.getWindow().unmaximize();
  } else {
    MainWindow.getWindow().maximize();
  }
});

// general
app.on("window-all-closed", () => app.quit());
