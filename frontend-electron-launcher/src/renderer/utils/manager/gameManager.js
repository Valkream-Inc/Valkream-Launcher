// function getLocalVersion() {
//   if (fs.existsSync(gameVersionFilePath)) {
//     const yamlContent = fs.readFileSync(gameVersionFilePath, "utf8").trim();
//     const parsed = yaml.parse(yamlContent);
//     const version = parsed.version;

//     return version;
//   } else return "0.0.0";
// }

// async function getOnlineVersion() {
//   try {
//     const yamlContent = (await axios.get(gameVersionFileLink)).data.trim();
//     const parsed = yaml.parse(yamlContent);
//     const version = parsed.version;
//     return version;
//   } catch (err) {
//     return "0.0.0";
//   }
// }

// async function downloadGame(callback = () => {}) {
//   return new Promise((resolve, reject) => {
//     if (!fs.existsSync(gameDir)) fs.mkdirSync(gameDir, { recursive: true });

//     ipcRenderer.on("download-multi-progress", (event, data) => {
//       callback(data.downloadedBytes, data.totalBytes, data.percent, data.speed);
//     });

//     ipcRenderer
//       .invoke("download-multiple-files", [
//         {
//           url: gameZipLink,
//           destPath: gameZipPath,
//         },
//       ])
//       .then(() => {
//         console.log("✅ Tous les fichiers ZIP ont été téléchargés !");
//         resolve();
//       })
//       .catch((err) => {
//         console.error("❌ Erreur pendant le téléchargement :", err);
//         reject(err);
//       });
//   });
// }

// async function extractGame(callback = () => {}) {
//   return new Promise((resolve, reject) => {
//     if (!fs.existsSync(path.join(gameZipPath))) {
//       throw new Error("Le jeu n'est pas téléchargés !");
//     }

//     ipcRenderer.on("multi-unzip-progress", (event, data) => {
//       callback(
//         data.decompressedBytes,
//         data.totalBytes,
//         data.percent,
//         data.speed
//       );
//     });

//     ipcRenderer
//       .invoke("multiple-unzip", [
//         {
//           path: gameZipPath,
//           destPath: gameDir,
//         },
//       ])
//       .then(() => {
//         console.log("✅ Tous les fichiers ZIP ont été décompressés !");

//         if (fs.existsSync(gameZipPath))
//           fs.rmSync(gameZipPath, { recursive: true });

//         resolve();
//       })
//       .catch((err) => {
//         console.error("❌ Erreur pendant la décompression :", err);
//         reject(err);
//       });
//   });
// }

// function setLocalVersion(version) {
//   return new Promise((resolve, reject) => {
//     const fileContent = `version: ${version}`;
//     try {
//       fs.writeFileSync(gameVersionFilePath, fileContent, "utf8");
//       resolve();
//     } catch (err) {
//       console.error("Erreur lors de l'écriture de la version locale:", err);
//       reject(err);
//     }
//   });
// }

// function playGame() {
//   ipcRenderer.send("main-window-hide");
//   console.log("▶️ Lancement du jeu:");
//   child = execFile(gameExePath, (err) => {});
//   child.on("exit", () => {
//     ipcRenderer.send("main-window-show");
//   });
// }

// const clearCache = async () => cleanGameFolder(gameDir, gameFolderToRemove);

// async function uninstallGame() {
//   if (fs.existsSync(appdataDir)) {
//     fs.rmSync(appdataDir, { recursive: true });
//     return true;
//   } else return false;
// }

// async function uninstallLauncherGame() {
//   this.uninstallGame();
//   const installPath = await ipcRenderer.invoke("get-app-path");
//   if (!dev) {
//     const uninstallerPath = path.join(
//       path.dirname(path.dirname(installPath)),
//       "Uninstall Valkream-Launcher.exe"
//     );
//     execFile(uninstallerPath, (err) => {});
//   }
// }

// async function openGameFolder() {
//   if (fs.existsSync(appdataDir)) {
//     shell.openPath(appdataDir); // => parent directory of gameDir
//     return true;
//   } else return false;
// }

// async function openLauncherFolder() {
//   try {
//     const installPath = await ipcRenderer.invoke("get-app-path");
//     if (fs.existsSync(installPath)) {
//       shell.openPath(path.dirname(path.dirname(installPath)));
//       return true;
//     } else return false;
//   } catch {
//     return false;
//   }
// }

const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");
const { ipcRenderer, shell } = require("electron");
const { cleanGameFolder } = require("valkream-function-lib");
const { execFile } = require("child_process");
const ThunderstoreManager = require("./thunderstoreManager.js");
const Manager = require("./manager.js");
const { database } = require(PathsManager.getSharedUtils());

const { gameFolderToRemove } = require(window.PathsManager.getConstants());

class GameManager extends ThunderstoreManager {
  constructor() {
    super();
    this.init();
    this.db = new database();
  }

  async init() {
    this.appdataDir = path.join(await ipcRenderer.invoke("data-path"));

    this.gameDir = path.join(this.appdataDir, "game", "Valheim");
    this.gameExePath = path.join(this.gameDir, "ValheimValkream.exe");

    for (const dir of [this.appdataDir, this.gameDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    this.initThunderstore(this.gameDir);
  }

  getGameDir = () => this.gameDir;

  async install() {
    const steamValheimPath = (await this.db.readData("configClient"))
      ?.launcher_config?.valheim_steam_path;

    return new Manager().handleError({
      ensure: steamValheimPath,
      then: () => {
        fse.copySync(path.join(steamValheimPath), this.gameDir);
      },
    });
  }

  async installBepInEx(callback = () => {}) {}

  async openFolder() {
    return new Manager().handleError({
      ensure: fs.existsSync(this.gameDir),
      then: async () => await shell.openPath(this.gameDir),
    });
  }

  clean() {
    return new Manager().handleError({
      ensure: fs.existsSync(this.gameDir),
      then: () => cleanGameFolder(this.gameDir, gameFolderToRemove),
    });
  }

  getIsInstalled() {
    return fs.existsSync(this.gameDir) && fs.existsSync(this.gameExePath);
  }

  async update() {
    return new Manager().handleError({
      ensure: fs.existsSync(this.gameDir) && fs.existsSync(this.gameExePath),
      then: () => {
        ipcRenderer.send("valheim:update:start", this.gameDir);
        ipcRenderer.on("valheim:update:log", (event, data) => {
          console.log(data);
        });
        ipcRenderer.on("valheim:update:error", (event, data) => {
          throw new Error(data);
        });
        ipcRenderer.on("valheim:update:done", (event, data) => {
          if (data) {
            console.log("update done", data);
            return data;
          } else {
            throw new Error("update failed");
          }
        });
      },
    });
  }

  uninstall() {
    return new Manager().handleError({
      ensure: fs.readdirSync(this.gameDir).length !== 0,
      then: () => {
        fs.rmSync(this.gameDir, { recursive: true });
        fs.mkdirSync(this.gameDir, { recursive: true });
      },
    });
  }

  play() {
    return new Manager().handleError({
      ensure: fs.existsSync(this.gameExePath),
      then: () => {
        ipcRenderer.send("main-window-hide");
        const child = execFile(this.gameExePath, (err) => {
          throw new Error(err);
        });
        child.on("exit", () => {
          ipcRenderer.send("main-window-show");
        });
      },
    });
  }
}

const gameManager = new GameManager();
gameManager.init();
module.exports = gameManager;
