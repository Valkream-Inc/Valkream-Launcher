/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { BrowserWindow, Menu } = require("electron");
const path = require("path");

const rendererPath = path.join(__dirname, "../../src/renderer");

const { pkg, isDev } = require("../constants");
let mainWindow = undefined;

function getWindow() {
  return mainWindow;
}

function destroyWindow() {
  if (!mainWindow) return;
  mainWindow.close();
  mainWindow = undefined;
}

function createWindow() {
  destroyWindow();
  mainWindow = new BrowserWindow({
    title: pkg.name,
    width: 1280,
    height: 720,
    minWidth: 980,
    minHeight: 552,
    resizable: true,
    icon: path.join(rendererPath, "public/icon/icon.png"),
    frame: false,
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(
    isDev ? "http://localhost:3000" : `file://${rendererPath}/dist/index.html`
  );
  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      if (isDev) mainWindow.webContents.openDevTools(/*{ mode: "detach" }*/);
      mainWindow.show();
    }
  });
}

module.exports = {
  getWindow,
  createWindow,
  destroyWindow,
};
