/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { app, ipcMain, dialog } = require("electron");
const MainWindow = require("./mainWindow.js");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

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

// Map pour stocker les processus enfants par nom de script
const runningScripts = {};

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

// Handler IPC pour upload de fichiers/dossiers
ipcMain.handle("upload-folder", async (event, files, targetDirArg) => {
  if (!targetDirArg) {
    throw new Error("Le dossier cible n'est pas spécifié");
  }
  const targetDir = path.resolve(targetDirArg);
  const fsPromises = fs.promises;

  // Fonction récursive pour supprimer tout le dossier
  async function removeDirContents(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = await fsPromises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await fsPromises.rm(fullPath, { recursive: true, force: true });
      } else {
        try {
          await fsPromises.unlink(fullPath);
        } catch (err) {
          if (err.code !== 'ENOENT') throw err;
          // Sinon, on ignore l'erreur si le fichier n'existe pas
        }
      }
    }
  }

  // Supprimer tout le contenu du dossier cible
  await removeDirContents(targetDir);

  // Calcul du total des bytes à écrire
  let totalBytes = files.reduce((acc, file) => acc + file.size, 0);
  let writtenBytes = 0;

  // Fonction pour créer les dossiers parents si besoin
  function ensureDirSync(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Copie des fichiers avec progression via stream amélioré
  for (const file of files) {
    const destPath = path.join(targetDir, file.relativePath);
    ensureDirSync(destPath);
    await new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(file.path);
      const writeStream = fs.createWriteStream(destPath);
      let fileWritten = 0;
      let lastProgressSent = Date.now();
      let errorOccurred = false;
      const sendProgress = (errMsg = null) => {
        event.sender.send("upload-progress", {
          writtenBytes,
          totalBytes,
          percent: Math.min(100, Math.round((writtenBytes / totalBytes) * 100)),
          error: errMsg || undefined,
        });
      };
      readStream.on("data", (chunk) => {
        writeStream.write(chunk, () => {
          fileWritten += chunk.length;
          writtenBytes += chunk.length;
          if (Date.now() - lastProgressSent > 50) {
            sendProgress();
            lastProgressSent = Date.now();
          }
        });
      });
      readStream.on("end", () => {
        sendProgress();
      });
      readStream.on("error", (err) => {
        errorOccurred = true;
        sendProgress("Erreur de lecture: " + err.message);
        reject(err);
      });
      writeStream.on("error", (err) => {
        errorOccurred = true;
        sendProgress("Erreur d'écriture: " + err.message);
        reject(err);
      });
      writeStream.on("close", () => {
        if (!errorOccurred) resolve();
      });
      readStream.pipe(writeStream, { end: true });
    });
  }
  return {
    success: true,
    message: `Upload de ${files.length} fichiers terminé.`,
  };
});
