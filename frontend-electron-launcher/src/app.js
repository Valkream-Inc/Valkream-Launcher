/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { app, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");

const path = require("path");
const fs = require("fs");
const axios = require("axios");

const UpdateWindow = require("./assets/js/windows/updateWindow.js");
const MainWindow = require("./assets/js/windows/mainWindow.js");
const { hasInternetConnection } = require("./assets/js/utils/internet.js");
const { downloadZip, unZip } = require("@valkream/shared");

let dev = process.env.NODE_ENV === "dev";
const { config } = require("@valkream/shared");
const { baseUrl } = config;

// process.env.DEV_TOOL === "open";

// Configuration de l'icône globale pour l'application
if (process.platform === "win32") {
  app.setAppUserModelId("Valkream-Launcher");
}

if (dev) {
  let appPath = path.resolve("./data/Launcher").replace(/\\/g, "/");
  let appdata = path.resolve("./data").replace(/\\/g, "/");
  if (!fs.existsSync(appPath)) fs.mkdirSync(appPath, { recursive: true });
  if (!fs.existsSync(appdata)) fs.mkdirSync(appdata, { recursive: true });
  app.setPath("userData", appPath);
  app.setPath("appData", appdata);
}

if (!app.requestSingleInstanceLock()) app.quit();
else
  app.whenReady().then(() => {
    if (dev) return MainWindow.createWindow();
    UpdateWindow.createWindow();
  });

ipcMain.on("main-window-open", () => MainWindow.createWindow());
ipcMain.on("main-window-dev-tools", () =>
  MainWindow.getWindow().webContents.openDevTools({ mode: "detach" })
);
ipcMain.on("main-window-dev-tools-close", () =>
  MainWindow.getWindow().webContents.closeDevTools()
);
ipcMain.on("main-window-close", () => MainWindow.destroyWindow());
ipcMain.on("main-window-reload", () => MainWindow.getWindow().reload());
ipcMain.on("main-window-progress", (event, options) =>
  MainWindow.getWindow().setProgressBar(options.progress / options.size)
);
ipcMain.on("main-window-progress-reset", () =>
  MainWindow.getWindow().setProgressBar(-1)
);
ipcMain.on("main-window-progress-load", () =>
  MainWindow.getWindow().setProgressBar(2)
);
ipcMain.on("main-window-minimize", () => MainWindow.getWindow().minimize());

ipcMain.on("update-window-close", () => UpdateWindow.destroyWindow());
ipcMain.on("update-window-dev-tools", () =>
  UpdateWindow.getWindow().webContents.openDevTools({ mode: "detach" })
);
ipcMain.on("update-window-progress", (event, options) =>
  UpdateWindow.getWindow().setProgressBar(options.progress / options.size)
);
ipcMain.on("update-window-progress-reset", () =>
  UpdateWindow.getWindow().setProgressBar(-1)
);
ipcMain.on("update-window-progress-load", () =>
  UpdateWindow.getWindow().setProgressBar(2)
);

ipcMain.handle("path-user-data", () => app.getPath("userData"));
ipcMain.handle("appData", (e) => app.getPath("appData"));

ipcMain.on("main-window-maximize", () => {
  if (MainWindow.getWindow().isMaximized()) {
    MainWindow.getWindow().unmaximize();
  } else {
    MainWindow.getWindow().maximize();
  }
});

ipcMain.on("main-window-hide", () => MainWindow.getWindow().hide());
ipcMain.on("main-window-show", () => MainWindow.getWindow().show());

ipcMain.handle("main-window-restart", () => {
  app.relaunch();
  app.exit(0);
});

app.on("window-all-closed", () => app.quit());

ipcMain.handle("get-app-path", () => {
  return app.getAppPath();
});

ipcMain.on("check-for-updates", async (event) => {
  const onError = (err, msg) => {
    console.error("Erreur mise à jour :", err);
    event.reply("update_status", msg || `❌ Erreur lors de la mise à jour.`);
    return setTimeout(() => event.reply("launch_main_window"), 2000);
  };

  const onMsg = (msg, redirect = false) => {
    event.reply("update_status", msg);
    return redirect
      ? setTimeout(() => event.reply("launch_main_window"), 2000)
      : null;
  };

  if (!(await hasInternetConnection()))
    return onError(
      "no_internet",
      "❌ Pas de connexion internet. Impossible de vérifier les mises à jour."
    );

  //config
  autoUpdater.allowDowngrade = true; // Autoriser le downgrade
  autoUpdater.allowPrerelease = true;
  autoUpdater.setFeedURL({
    provider: "generic",
    url: `${baseUrl}/launcher/latest/`,
  });
  autoUpdater.autoDownload = false;

  //listeners
  autoUpdater.removeAllListeners();
  autoUpdater.on("error", (err) => onError(err));
  autoUpdater.on("update-not-available", () =>
    onMsg("🟢 Aucune mise à jour.", true)
  );

  autoUpdater.on("update-available", async (info) => {
    onMsg("🔄 Mise à jour disponible...");

    try {
      await autoUpdater.downloadUpdate();
      onMsg("✅ Mise à jour téléchargée. Redémarrage...");
      setTimeout(() => autoUpdater.quitAndInstall(false, true), 2000);
    } catch (err) {
      onError(`Erreur téléchargement update: ${err}`);
    }
  });

  // Lancer la vérification
  try {
    await autoUpdater.checkForUpdates();
  } catch (err) {
    onError(`Erreur lors de la vérification des mises à jour: ${err}`);
  }
});

ipcMain.handle("download-multiple-zips", async (event, files) => {
  // files: tableau [{ url, destPath }]
  const totalSizes = new Array(files.length).fill(0);
  const downloaded = new Array(files.length).fill(0);
  const speeds = new Array(files.length).fill(0);
  let totalGlobal = 0;
  let downloadedGlobal = 0;
  let speedGlobal = 0;

  // 1. Préparation : récupérer les tailles
  await Promise.all(
    files.map(async (file, index) => {
      const head = await axios.head(file.url);
      const size = parseInt(head.headers["content-length"], 10);
      totalSizes[index] = size;
      totalGlobal += size;
    })
  );

  // 2. Lancement des téléchargements en parallèle
  const downloads = files.map((file, index) => {
    return new Promise(async (resolve, reject) => {
      try {
        await downloadZip(
          file.url,
          file.destPath,
          (downloadedBytes, totalBytes, pourcentageDuFichier, speed) => {
            downloaded[index] = downloadedBytes;
            speeds[index] = speed;
            downloadedGlobal = downloaded.reduce((a, b) => a + b, 0);
            speedGlobal = speeds.reduce((a, b) => a + b, 0);
            const percent = Math.round((downloadedGlobal / totalGlobal) * 100);

            event.sender.send("download-multi-progress", {
              percent,
              downloadedBytes: downloadedGlobal,
              totalBytes: totalGlobal,
              speed: speedGlobal,
            });
          }
        );
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });

  // 3. Attente de tous les téléchargements
  return Promise.all(downloads);
});

ipcMain.handle("multiple-unzip", async (event, zips) => {
  // zips: tableau [{ path, destPath }]
  const totalSizes = new Array(zips.length).fill(0);
  const decompressed = new Array(zips.length).fill(0);
  const speeds = new Array(zips.length).fill(0);
  let totalGlobal = 0;
  let decompressedGlobal = 0;
  let speedGlobal = 0;

  // 1. Lancement des décompressions en parallèle
  const decompressions = zips.map((zip, index) => {
    return new Promise(async (resolve, reject) => {
      try {
        await unZip(
          zip.path,
          zip.destPath,
          (decompressedBytes, totalBytes, pourcentageDuFichier, speed) => {
            decompressed[index] = decompressedBytes;
            totalSizes[index] = totalBytes;
            speeds[index] = speed;
            decompressedGlobal = decompressed.reduce((a, b) => a + b, 0);
            speedGlobal = speeds.reduce((a, b) => a + b, 0);
            totalGlobal = totalSizes.reduce((a, b) => a + b, 0);
            const percent = Math.round(
              (decompressedGlobal / totalGlobal) * 100
            );

            event.sender.send("multi-unzip-progress", {
              percent,
              decompressedBytes: decompressedGlobal,
              totalBytes: totalGlobal,
              speed: speedGlobal,
            });
          }
        );
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });

  // 2. Attente de tous les téléchargements
  return Promise.all(decompressions);
});
