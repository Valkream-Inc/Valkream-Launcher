/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { app, ipcMain, dialog } = require("electron");
const MainWindow = require("./mainWindow.js");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

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
ipcMain.handle("show-open-dialog", async () => {
  return await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
});

// Exécution de scripts Node.js
ipcMain.handle("execute-node-script", async (event, scriptPath, args = []) => {
  return new Promise((resolve, reject) => {
    const scriptDir = path.dirname(scriptPath);
    const scriptName = path.basename(scriptPath);

    const child = spawn("node", [scriptName, ...args], {
      cwd: scriptDir,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let output = "";
    let errorOutput = "";

    child.stdout.on("data", (data) => {
      const newData = data.toString();
      output += newData;
      // Envoyer les données en temps réel au renderer
      event.sender.send("script-output", { type: "stdout", data: newData });
    });

    child.stderr.on("data", (data) => {
      const newData = data.toString();
      errorOutput += newData;
      // Envoyer les données en temps réel au renderer
      event.sender.send("script-output", { type: "stderr", data: newData });
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true, output, errorOutput });
      } else {
        resolve({ success: false, output, errorOutput, exitCode: code });
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
});
