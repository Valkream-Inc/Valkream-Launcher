/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { BrowserWindow, Menu } = require("electron");
const path = require("path");

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
    icon: path.join(__dirname, "../../assets/images/icon.png"),
    frame: false,
    show: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(
    path.join(__dirname, "../../renderer/windows/launcher/launcher.html")
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
