/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const pkg = require("./package.json");
let dev = process.env.DEV_TOOL === "open";
let mainWindow = undefined;

function getWindow() {
  return mainWindow;
}

function destroyWindow() {
  if (!mainWindow) return;
  app.quit();
  mainWindow = undefined;
}

function createWindow() {
  destroyWindow();
  mainWindow = new BrowserWindow({
    title: "Updater UI",
    width: 1280,
    height: 720,
    minWidth: 980,
    minHeight: 552,
    resizable: true,
    icon: path.join(app.getAppPath(), "/src/images/icon.png"),
    frame: false,
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(`${app.getAppPath()}/src/html/index.html`));
  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      if (dev) mainWindow.webContents.openDevTools({ mode: "detach" });
      mainWindow.show();
    }
  });
}

module.exports = {
  getWindow,
  createWindow,
  destroyWindow,
};
