/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import hasInternetConnection from "./internet.js";
import database from "./database.js";
import logger from "./logger.js";
import popup from "./popup.js";

async function changePage(id) {
  let panel = document.querySelector(`#${id}-page`);
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

export {
  changePage as changePage,
  showSnackbar as showSnackbar,
  hasInternetConnection as hasInternetConnection,
  database as database,
  logger as logger,
  popup as popup,
};
