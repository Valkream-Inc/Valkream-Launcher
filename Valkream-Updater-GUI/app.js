/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { app, ipcMain, dialog } = require("electron");
const MainWindow = require("./mainWindow.js");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { zipFolder, hashFolder } = require("valkream-function-lib");

const dev = process.env.NODE_ENV === "development";

if (process.platform === "win32") app.setAppUserModelId("Updater-UI");
if (!app.requestSingleInstanceLock()) app.quit();
else
  app.whenReady().then(() => {
    MainWindow.createWindow();
    if (dev)
      MainWindow.getWindow().webContents.openDevTools({ mode: "detach" });
  });

// Configuration du repertoir pour la base de données
if (dev) {
  let appPath = path.resolve("./data/Updater").replace(/\\/g, "/");
  let appDataPath = path.resolve("./data/AppData").replace(/\\/g, "/");
  if (!fs.existsSync(appPath)) fs.mkdirSync(appPath, { recursive: true });
  if (!fs.existsSync(appDataPath))
    fs.mkdirSync(appDataPath, { recursive: true });
  app.setPath("userData", appPath);
  app.setPath("appData", appDataPath);
}
ipcMain.handle("path-user-data", () => app.getPath("userData"));
ipcMain.handle("path-app-data", () => app.getPath("appData"));

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

// Map pour stocker les processus enfants par nom de script
const runningScripts = {};
// Map pour stocker les processus de zippage par nom de script
const runningZipProcesses = {};

// Exécution de scripts Node.js
ipcMain.handle(
  "execute-node-script",
  async (event, scriptPath, args = [], scriptName = "default") => {
    return new Promise((resolve, reject) => {
      const scriptDir = path.dirname(scriptPath);
      const scriptBaseName = path.basename(scriptPath);
      // Utilise le nom fourni ou le nom du script
      const key = scriptName || scriptBaseName;

      const child = spawn("node", [scriptBaseName, ...args], {
        cwd: scriptDir,
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Stocke le process pour pouvoir l'annuler
      runningScripts[key] = child;

      let output = "";
      let errorOutput = "";

      child.stdout.on("data", (data) => {
        const newData = data.toString();
        output += newData;
        event.sender.send(`script-output-${scriptName}`, {
          type: "stdout",
          data: newData,
        });
      });

      child.stderr.on("data", (data) => {
        const newData = data.toString();
        errorOutput += newData;
        event.sender.send("script-output", { type: "stderr", data: newData });
      });

      child.on("close", (code, signal) => {
        // Nettoie la référence
        delete runningScripts[key];
        if (code === 0) {
          resolve({ success: true, output, errorOutput });
        } else if (signal) {
          resolve({
            success: false,
            output,
            errorOutput,
            exitCode: code,
            signal,
          });
        } else {
          resolve({ success: false, output, errorOutput, exitCode: code });
        }
      });

      child.on("error", (error) => {
        delete runningScripts[key];
        reject(error);
      });
    });
  }
);

// Handler pour annuler un script en cours
ipcMain.handle("cancel-node-script", (event, scriptName = "default") => {
  const child = runningScripts[scriptName];
  if (child) {
    child.kill();
    delete runningScripts[scriptName];
    return { success: true, message: `Script ${scriptName} annulé.` };
  } else {
    return { success: false, message: `Aucun script ${scriptName} en cours.` };
  }
});

ipcMain.handle(
  "zip-folder",
  async (event, sourceFolderPath, zipOutputPath, scriptName) => {
    return new Promise((resolve, reject) => {
      // Vérifier si le processus est déjà annulé
      if (
        runningZipProcesses[scriptName] &&
        runningZipProcesses[scriptName].cancelled
      ) {
        reject(new Error("Processus annulé"));
        return;
      }

      const zipProcess = {
        cancelled: false,
        resolve,
        reject,
      };

      runningZipProcesses[scriptName] = zipProcess;

      zipFolder(
        sourceFolderPath,
        zipOutputPath,
        (processedBytes, totalBytes, fileName, speed) => {
          // Vérifier si le processus a été annulé
          if (zipProcess.cancelled) {
            return;
          }

          event.sender.send(`zip-folder-${scriptName}`, {
            type: "progress",
            processedBytes,
            totalBytes,
            fileName: fileName || path.basename(zipOutputPath),
            percentage:
              totalBytes > 0
                ? Math.round((processedBytes / totalBytes) * 100)
                : 0,
            speed,
          });
        },
        zipProcess // Passer le token d'annulation
      )
        .then((result) => {
          if (!zipProcess.cancelled) {
            event.sender.send(`zip-folder-${scriptName}`, {
              type: "complete",
              filePath: zipOutputPath,
              result,
            });
            resolve(result);
          }
          delete runningZipProcesses[scriptName];
        })
        .catch((error) => {
          if (!zipProcess.cancelled) {
            reject(error);
          }
          delete runningZipProcesses[scriptName];
        });
    });
  }
);

// Handler pour annuler un processus de zippage
ipcMain.handle("cancel-zip-process", (event, scriptName) => {
  const zipProcess = runningZipProcesses[scriptName];
  if (zipProcess) {
    zipProcess.cancelled = true;
    zipProcess.reject(new Error("Processus annulé"));
    delete runningZipProcesses[scriptName];
    return {
      success: true,
      message: `Processus de zippage ${scriptName} annulé.`,
    };
  } else {
    return {
      success: false,
      message: `Aucun processus de zippage ${scriptName} en cours.`,
    };
  }
});

ipcMain.handle("hash-folder", async (event, folderPath) => {
  return await hashFolder(folderPath);
});

ipcMain.handle("progress-process", async (event, process_id, data) => {
  event.sender.send(`process-progress-${process_id}`, data);
});
