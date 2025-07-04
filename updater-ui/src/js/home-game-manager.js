const fs = require("fs");
import PostGamePanel from "./panels/post-game.js";
import UploadGamePanel from "./panels/upload-game.js";

class HomeGameManager {
  init() {
    this.panels = document.querySelector(".game-panels");
    this.initGamesPanels();
    this.initGameButtons();
  }

  initGamesPanels() {
    for (let panel of fs.readdirSync(`${__dirname}/../html/panels/`)) {
      if (panel.includes("game")) {
        const html = fs.readFileSync(
          `${__dirname}/../html/panels/${panel}`,
          "utf8"
        );
        this.panels.innerHTML += html;
      }
    }

    this.changeGamePanel("upload-game-panel", new UploadGamePanel());
  }

  initGameButtons() {
    const uploadBtn = document.getElementById("btn-upload-game");
    const buildBtn = document.getElementById("btn-build-game");
    const postBtn = document.getElementById("btn-post-game");
    const changeVersionBtn = document.getElementById("btn-change-version-game");
    const deleteVersionBtn = document.getElementById("btn-delete-version-game");

    uploadBtn.addEventListener("click", () => {
      this.changeGamePanel("upload-game-panel", new UploadGamePanel());
    });

    buildBtn.addEventListener("click", () => {
      this.changeGamePanel("build-game-panel");
    });

    postBtn.addEventListener("click", () => {
      this.changeGamePanel("post-game-panel", new PostGamePanel());
    });

    changeVersionBtn.addEventListener("click", () => {
      this.changeGamePanel("change-version-game-panel");
    });

    deleteVersionBtn.addEventListener("click", () => {
      this.changeGamePanel("delete-version-game-panel");
    });
  }

  changeGamePanel(panelToRender, panelAction = () => {}) {
    if (!window.isGameProcessRunning) {
      for (let panel of this.panels.children) {
        panel.style.display = "none";
      }
      const panelToDisplay = document.getElementById(panelToRender);
      if (panelToDisplay) panelToDisplay.style.display = "block";
      if (panelAction) setTimeout(() => panelAction, 100);
    }
  }
}

export default HomeGameManager;
