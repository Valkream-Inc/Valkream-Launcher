/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { BrowserWindow, Menu, ipcMain } from "electron";
import path from "path";

const rendererPath = path.join(import.meta.dirname, "../../../renderer");

import { isDev, pkg } from "../core/constants.js";
let mainWindow: BrowserWindow | undefined = undefined;

function getWindow(): BrowserWindow | undefined {
  return mainWindow;
}

function destroyWindow(): void {
  if (!mainWindow) return;
  mainWindow.close();
  mainWindow = undefined;
}

function isWindowOpen(): boolean {
  return mainWindow !== undefined && !mainWindow.isDestroyed();
}

function createWindow(): void {
  destroyWindow();
  mainWindow = new BrowserWindow({
    title: pkg.name,
    width: 1280,
    height: 720,
    minWidth: 980,
    minHeight: 552,
    resizable: true,
    icon: isDev
      ? path.join(rendererPath, "public/images/icon/icon.png")
      : path.join(import.meta.dirname, "../../frontend/images/icon/icon.png"),
    frame: false,
    show: false,
    webPreferences: {
      preload: path.join(import.meta.dirname, "mainPreload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(
    isDev
      ? "http://localhost:8080"
      : `file://${path.join(import.meta.dirname, "../../frontend", "index.html")}`,
  );
  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      if (isDev) mainWindow.webContents.openDevTools();
      mainWindow.show();
    }
  });

  // NEW: Handle the request for the window's maximization state
  ipcMain.handle("get-is-maximized", () => {
    return (mainWindow as BrowserWindow).isMaximized();
  });

  // NEW: Send events to the renderer when the window state changes
  mainWindow.on("maximize", () => {
    (mainWindow as BrowserWindow).webContents.send("on-maximize");
  });

  mainWindow.on("unmaximize", () => {
    (mainWindow as BrowserWindow).webContents.send("on-unmaximize");
  });
}

export { createWindow, destroyWindow, getWindow, isWindowOpen };
