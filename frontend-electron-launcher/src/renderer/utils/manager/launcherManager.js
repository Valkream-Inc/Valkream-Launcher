const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { execFile } = require("child_process");
const { ipcRenderer, shell } = require("electron");
const yaml = require("yaml");
const { cleanGameFolder } = require("valkream-function-lib");

const {
  baseUrl,
  gameFolderToRemove,
} = require(window.PathsManager.getConstants());

const appdataDir = path.join(process.cwd(), ".valkream-launcher");
const serverGameRoot = path.join(baseUrl, "game/latest");

const gameVersionFileName = "latest.yml";
const gameVersionFileLink = path.join(serverGameRoot, gameVersionFileName);
const gameVersionFilePath = path.join(appdataDir, gameVersionFileName);

const gameZipName = "game.zip";
const gameZipLink = path.join(serverGameRoot, gameZipName);
const gameZipPath = path.join(appdataDir, gameZipName);

const gameDir = path.join(appdataDir, "Valheim Valkream Data");
const gameExePath = path.join(gameDir, "ValheimValkream.exe");

const dev = process.env.DEV_TOOL === "open";

function getLocalVersion() {
  if (fs.existsSync(gameVersionFilePath)) {
    const yamlContent = fs.readFileSync(gameVersionFilePath, "utf8").trim();
    const parsed = yaml.parse(yamlContent);
    const version = parsed.version;

    return version;
  } else return "0.0.0";
}

async function getOnlineVersion() {
  try {
    const yamlContent = (await axios.get(gameVersionFileLink)).data.trim();
    const parsed = yaml.parse(yamlContent);
    const version = parsed.version;
    return version;
  } catch (err) {
    return "0.0.0";
  }
}

async function downloadGame(callback = () => {}) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(gameDir)) fs.mkdirSync(gameDir, { recursive: true });

    ipcRenderer.on("download-multi-progress", (event, data) => {
      callback(data.downloadedBytes, data.totalBytes, data.percent, data.speed);
    });

    ipcRenderer
      .invoke("download-multiple-files", [
        {
          url: gameZipLink,
          destPath: gameZipPath,
        },
      ])
      .then(() => {
        console.log("✅ Tous les fichiers ZIP ont été téléchargés !");
        resolve();
      })
      .catch((err) => {
        console.error("❌ Erreur pendant le téléchargement :", err);
        reject(err);
      });
  });
}

async function extractGame(callback = () => {}) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(path.join(gameZipPath))) {
      throw new Error("Le jeu n'est pas téléchargés !");
    }

    ipcRenderer.on("multi-unzip-progress", (event, data) => {
      callback(
        data.decompressedBytes,
        data.totalBytes,
        data.percent,
        data.speed
      );
    });

    ipcRenderer
      .invoke("multiple-unzip", [
        {
          path: gameZipPath,
          destPath: gameDir,
        },
      ])
      .then(() => {
        console.log("✅ Tous les fichiers ZIP ont été décompressés !");

        if (fs.existsSync(gameZipPath))
          fs.rmSync(gameZipPath, { recursive: true });

        resolve();
      })
      .catch((err) => {
        console.error("❌ Erreur pendant la décompression :", err);
        reject(err);
      });
  });
}

function setLocalVersion(version) {
  return new Promise((resolve, reject) => {
    const fileContent = `version: ${version}`;
    try {
      fs.writeFileSync(gameVersionFilePath, fileContent, "utf8");
      resolve();
    } catch (err) {
      console.error("Erreur lors de l'écriture de la version locale:", err);
      reject(err);
    }
  });
}

function playGame() {
  ipcRenderer.send("main-window-hide");
  console.log("▶️ Lancement du jeu:");
  child = execFile(gameExePath, (err) => {});
  child.on("exit", () => {
    ipcRenderer.send("main-window-show");
  });
}

const clearCache = async () => cleanGameFolder(gameDir, gameFolderToRemove);

async function uninstallGame() {
  if (fs.existsSync(appdataDir)) {
    fs.rmSync(appdataDir, { recursive: true });
    return true;
  } else return false;
}

async function uninstallLauncherGame() {
  this.uninstallGame();
  const installPath = await ipcRenderer.invoke("get-app-path");
  if (!dev) {
    const uninstallerPath = path.join(
      path.dirname(path.dirname(installPath)),
      "Uninstall Valkream-Launcher.exe"
    );
    execFile(uninstallerPath, (err) => {});
  }
}

async function openGameFolder() {
  if (fs.existsSync(appdataDir)) {
    shell.openPath(appdataDir); // => parent directory of gameDir
    return true;
  } else return false;
}

async function openLauncherFolder() {
  try {
    const installPath = await ipcRenderer.invoke("get-app-path");
    if (fs.existsSync(installPath)) {
      shell.openPath(path.dirname(path.dirname(installPath)));
      return true;
    } else return false;
  } catch {
    return false;
  }
}

module.exports = {
  getLocalVersion,
  getOnlineVersion,
  downloadGame,
  extractGame,
  setLocalVersion,
  playGame,
  clearCache,
  uninstallGame,
  openGameFolder,
  openLauncherFolder,
};
