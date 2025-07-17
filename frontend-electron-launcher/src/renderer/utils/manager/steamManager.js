const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");
const { ipcRenderer, shell } = require("electron");
const Manager = require("./manager.js");
const { database } = require(PathsManager.getSharedUtils());

class SteamManager {
  static id = "steam-manager";

  constructor() {
    this.init();
    this.db = new database();
  }

  async init() {
    this.appdataDir = path.join(await ipcRenderer.invoke("data-path"));

    this.gameDir = path.join(this.appdataDir, "game", "Valheim");

    for (const dir of [this.appdataDir, this.gameDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

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

  async update() {
    return new Manager().handleError({
      ensure: fs.existsSync(this.gamePath),
      then: async () => shell.openExternal("steam://rungameid/892970"),
    });
  }
}

const steamManager = new SteamManager();
steamManager.init();
module.exports = steamManager;
