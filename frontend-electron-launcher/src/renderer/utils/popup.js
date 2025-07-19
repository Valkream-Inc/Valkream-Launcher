/**
 * @author  Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { ipcRenderer } = require("electron");

class Popup {
  constructor() {
    this.popup = document.querySelector(".popup");
    this.popupTitle = document.querySelector(".popup-title");
    this.popupContent = document.querySelector(".popup-content");
    this.popupOptions = document.querySelector(".popup-options");
    this.popupButton = document.querySelector(".popup-button");
  }

  openPopup(info) {
    this.popup.style.display = "flex";
    if (info.background == false) this.popup.style.background = "none";
    else this.popup.style.background = "#000000b3";
    this.popupTitle.innerHTML = info.title;
    this.popupContent.style.color = info.color ? info.color : "#e21212";
    this.popupContent.innerHTML =
      info.content +
      `<br><br>
      <span${
        info.bottomId ? ` id=\"${info.bottomId}\"` : ""
      } class='popup-bottom-content'>${info.bottomContent || "Bon Jeu !"}</span>
    `;

    if (info.options) this.popupOptions.style.display = "flex";

    if (this.popupOptions.style.display !== "none") {
      this.popupButton.addEventListener("click", () => {
        if (info.exit) return ipcRenderer.send("main-window-close");
        this.closePopup();
      });
    }
  }

  closePopup() {
    this.popup.style.display = "none";
    this.popupTitle.innerHTML = "";
    this.popupContent.innerHTML = "";
    this.popupOptions.style.display = "none";
  }
}

module.exports = Popup;
