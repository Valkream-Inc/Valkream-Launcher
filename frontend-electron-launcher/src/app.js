/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { app, ipcMain } = require("electron");

const path = require("path");
const fs = require("fs");

const UpdateWindow = require("./main/windows/updateWindow.js");
const MainWindow = require("./main/windows/mainWindow.js");
const CheckForUpdates = require("./main/ipcMain/check-for-updates.js");
const DowloadMultiplefiles = require("./main/ipcMain/download-multiple-zips.js");
const MultipleUnzip = require("./main/ipcMain/multiple-unzip.js");

let dev = process.env.NODE_ENV === "dev";

if (process.platform === "win32") app.setAppUserModelId("Valkream-Launcher");
if (!app.requestSingleInstanceLock()) app.quit();
else
  app.whenReady().then(() => {
    if (dev) return MainWindow.createWindow();
    else UpdateWindow.createWindow();
  });

// Configuration du repertoir pour la base de données
if (dev) {
  let appPath = path.resolve("./data/Launcher").replace(/\\/g, "/");
  if (!fs.existsSync(appPath)) fs.mkdirSync(appPath, { recursive: true });
  app.setPath("userData", appPath);
}
ipcMain.handle("path-user-data", () => app.getPath("userData"));

// update  windows
ipcMain.on("update-window-close", () => UpdateWindow.destroyWindow());

// main windows
ipcMain.on("main-window-open", () => MainWindow.createWindow());
ipcMain.on("main-window-close", () => MainWindow.destroyWindow());
ipcMain.on("main-window-reload", () => MainWindow.getWindow().reload());
ipcMain.on("main-window-minimize", () => MainWindow.getWindow().minimize());
ipcMain.on("main-window-hide", () => MainWindow.getWindow().hide());
ipcMain.on("main-window-show", () => MainWindow.getWindow().show());
ipcMain.handle("main-window-restart", () => {
  app.relaunch();
  app.exit(0);
});
ipcMain.on("main-window-maximize", () => {
  if (MainWindow.getWindow().isMaximized()) {
    MainWindow.getWindow().unmaximize();
  } else {
    MainWindow.getWindow().maximize();
  }
});

// general
app.on("window-all-closed", () => app.quit());
ipcMain.handle("get-app-path", () => app.getAppPath());
ipcMain.on("check-for-updates", (event) => new CheckForUpdates(event).init());

// zips
ipcMain.handle(
  "download-multiple-files",
  async (event, files) => await new DowloadMultiplefiles().init(event, files)
);
ipcMain.handle(
  "multiple-unzip",
  async (event, zips) => await new MultipleUnzip().init(event, zips)
);
