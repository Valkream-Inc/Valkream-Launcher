/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { BrowserWindow, Menu } = require("electron");
const path = require("path");

const rendererPath = path.join(__dirname, "../../../renderer");

const { isDev } = require("../constants");
let updateWindow = undefined;

function getWindow() {
  return updateWindow;
}

function destroyWindow() {
  if (!updateWindow) return;
  updateWindow.close();
  updateWindow = undefined;
}

function createWindow() {
  destroyWindow();
  updateWindow = new BrowserWindow({
    title: "Mise à jour",
    width: 512,
    height: 288,
    resizable: false,
    icon: isDev
      ? path.join(rendererPath, "public/images/icon/icon.png")
      : path.join(__dirname, "../../frontend/images/icon/icon.png"),
    frame: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "updatePreload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  Menu.setApplicationMenu(null);
  updateWindow.setMenuBarVisibility(false);
  updateWindow.loadURL(
    isDev
      ? "http://localhost:8080/#/updater"
      : `file://${path.join(
          __dirname,
          "../../frontend",
          "index.html"
        )}#/updater`
  );
  updateWindow.once("ready-to-show", () => {
    if (updateWindow) {
      if (isDev) updateWindow.webContents.openDevTools({ mode: "detach" });
      updateWindow.show();
    }
  });
}

module.exports = {
  getWindow,
  createWindow,
  destroyWindow,
};
