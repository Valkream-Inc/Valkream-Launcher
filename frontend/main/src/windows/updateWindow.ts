/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { BrowserWindow, Menu } from "electron";
import path from "path";

const rendererPath = path.join(__dirname, "../../../renderer");

import { isDev } from "../constants/index";
let updateWindow: BrowserWindow | undefined = undefined;

function getWindow(): BrowserWindow | undefined {
  return updateWindow;
}

function destroyWindow(): void {
  if (!updateWindow) return;
  updateWindow.close();
  updateWindow = undefined;
}

function createWindow(): void {
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

export {
  getWindow,
  createWindow,
  destroyWindow,
};
