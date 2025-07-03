/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import hasInternetConnection from "./internet.js";
import database from "./database.js";
import logger from "./logger.js";
import popup from "./popup.js";

async function changePanel(id) {
  let panel = document.querySelector(`#${id}-panel`);
  let active = document.querySelector(`.active`);
  if (active) active.classList.toggle("active");
  panel.classList.add("active");
}

function showSnackbar(message, type = "success", duration = 3000) {
  const snackbar = document.getElementById("snackbar");
  if (!snackbar) return;
  snackbar.textContent = message;
  snackbar.className = `show ${type}`;
  setTimeout(() => {
    snackbar.className = snackbar.className
      .replace(/show|success|error/g, "")
      .trim();
  }, duration);
}

async function applyMusicSetting() {
  try {
    const videoElement = document.getElementById("background-video");
    const db = new database();
    const configClient = await db.readData("configClient");
    const musicEnabled = configClient?.launcher_config?.musicEnabled;

    if (videoElement) {
      videoElement.muted = musicEnabled;
    }
  } catch (error) {
    console.error("Erreur lors de l'application du paramètre musique:", error);
  }
}

export {
  changePanel as changePanel,
  showSnackbar as showSnackbar,
  applyMusicSetting as applyMusicSetting,
  hasInternetConnection as hasInternetConnection,
  database as database,
  logger as logger,
  popup as popup,
};
