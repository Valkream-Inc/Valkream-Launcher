/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

class Popup {
  constructor() {
    this.popup = document.querySelector(".popup");
    this.popupTab = document.querySelector(".popup-tab");
    this.popupTitle = document.querySelector(".popup-title");
    this.popupContent = document.querySelector(".popup-content");
    this.popupOptions = document.querySelector(".popup-options");
    this.popupButton = document.querySelector(".popup-button");

    // Fermer le popup quand on clique en dehors
    this.popup.addEventListener("click", () => this.closePopup());

    // Empêche la fermeture quand on clique sur la popup-tab
    this.popupTab.addEventListener("click", (e) => e.stopPropagation());
  }

  openPopup(info) {
    this.popup.style.display = "flex";

    // Force le repaint pour que l'animation fonctionne
    requestAnimationFrame(() => {
      this.popup.classList.add("show");
    });

    this.popup.style.background =
      info.background !== false ? "rgba(0,0,0,0.7)" : "transparent";

    this.popupTitle.innerHTML = `<span class="popup-title-highlight">${info.title}</span>`;
    this.popupContent.style.color = info.color || "white";
    this.popupContent.innerHTML = `
      ${info.content}<br><br>
      <span${
        info.bottomId ? ` id="${info.bottomId}"` : ""
      } class="popup-bottom-content">${info.bottomContent || "Bon Jeu !"}</span>
    `;

    this.popupOptions.style.display = info.options !== false ? "flex" : "none";

    if (info.options !== false) {
      const handleClick = () => {
        if (info.onExit) info.onExit();
        this.closePopup();
        this.popupButton.removeEventListener("click", handleClick);
      };
      this.popupButton.addEventListener("click", handleClick);
    }
  }

  closePopup() {
    this.popup.classList.remove("show");
    // Attend la fin de l'animation avant de cacher
    setTimeout(() => {
      this.popup.style.display = "none";
      this.popupTitle.innerHTML = "";
      this.popupContent.innerHTML = "";
      this.popupOptions.style.display = "none";
    }, 400); // Durée identique à la transition CSS
  }
}

module.exports = Popup;
