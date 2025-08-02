/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

function showSnackbar(message, type = "success", duration = 3000) {
  const snackbarContainer = document.querySelector("#snackbar-container");
  if (!snackbarContainer) return;

  // Limiter le nombre de snackbars à 5
  const maxSnackbars = 5;
  const existingSnackbars = snackbarContainer.querySelectorAll(".snackbar");

  // Supprimer les snackbars les plus anciennes si on dépasse la limite
  if (existingSnackbars.length >= maxSnackbars) {
    const oldestSnackbar = existingSnackbars[0];
    snackbarContainer.removeChild(oldestSnackbar);
  }

  const snackbar = document.createElement("div");
  snackbar.textContent = message;
  snackbar.className = `snackbar ${type}`;
  snackbarContainer.appendChild(snackbar);

  // Ajouter la classe "show" après un petit délai pour déclencher l'animation
  setTimeout(() => {
    snackbar.classList.add("show");
  }, 10);

  setTimeout(() => {
    if (snackbar.parentNode) {
      snackbar.classList.remove("show");
      setTimeout(() => {
        if (snackbar.parentNode) {
          snackbarContainer.removeChild(snackbar);
        }
      }, 400);
    }
  }, duration);
}

module.exports = {
  showSnackbar,
};
