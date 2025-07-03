import { changePage } from "./utils/utils.js";
const fs = require("fs");
const PostGamePanel = require("../js/panels/post-game.js");

// Variable globale pour suivre l'état d'exécution
window.isProcessRunning = false;

class Home {
  static id = "home";

  async init() {
    this.step = 0;
    this.title = document.querySelector(".topbar-title");
    this.btnGame = document.getElementById("btn-game");
    this.btnLauncher = document.getElementById("btn-launcher");
    this.btnEvent = document.getElementById("btn-event");
    this.btnSettings = document.getElementById("btn-settings");
    this.initButtons();
    this.initPanelsGameButtons();
  }

  initButtons() {
    this.title.addEventListener("click", () => {
      if (!window.isProcessRunning) {
        this.changePanel(0, this.title);
      }
    });

    this.btnGame.addEventListener("click", () => {
      if (!window.isProcessRunning) {
        this.changePanel(1, this.btnGame);
      }
    });

    this.btnLauncher.addEventListener("click", () => {
      if (!window.isProcessRunning) {
        this.changePanel(2, this.btnLauncher);
      }
    });

    this.btnEvent.addEventListener("click", () => {
      if (!window.isProcessRunning) {
        this.changePanel(3, this.btnEvent);
      }
    });

    this.btnSettings.addEventListener("click", () => {
      if (!window.isProcessRunning) {
        changePage("config");
      }
    });
  }

  changePanel(step, btn) {
    this.step = step;
    const steps = document.querySelectorAll(".home-content-step");
    steps.forEach((step) => {
      step.style.display = "none";
    });
    document.getElementById(`home-content-step-${step}`).style.display =
      "block";

    this.btnGame.classList.remove("active");
    this.btnLauncher.classList.remove("active");
    this.btnEvent.classList.remove("active");
    if (btn) btn.classList.add("active");
  }

  initPanelsGameButtons() {
    let isActive = true;
    const panels = document.querySelector(".game-panels");

    const buildBtn = document.getElementById("btn-build-game");
    const postBtn = document.getElementById("btn-post-game");
    const changeVersionBtn = document.getElementById("btn-change-version-game");
    const deleteVersionBtn = document.getElementById("btn-delete-version-game");

    for (let panel of fs.readdirSync(`${__dirname}/../html/panels/`)) {
      if (panel.includes("game")) {
        const html = fs.readFileSync(
          `${__dirname}/../html/panels/${panel}`,
          "utf8"
        );
        panels.innerHTML += html;
      }
    }

    for (let panel of panels.children) {
      panel.style.display = "none";
    }

    const panelsGame = document.querySelector("#build-game-panel");
    panelsGame.style.display = "block";

    buildBtn.addEventListener("click", () => {
      if (!window.isProcessRunning) {
        renderPanel("build-game-panel");
      }
    });

    postBtn.addEventListener("click", () => {
      if (!window.isProcessRunning) {
        renderPanel("post-game-panel");
        // Initialiser le panel post-game
        setTimeout(() => {
          new PostGamePanel();
        }, 100);
      }
    });

    changeVersionBtn.addEventListener("click", () => {
      if (!window.isProcessRunning) {
        renderPanel("change-version-game-panel");
      }
    });

    deleteVersionBtn.addEventListener("click", () => {
      if (!window.isProcessRunning) {
        renderPanel("delete-version-game-panel");
      }
    });

    const renderPanel = (panelToRender) => {
      for (let panel of panels.children) {
        panel.style.display = "none";
      }
      const panelToDisplay = document.getElementById(panelToRender);
      if (panelToDisplay) panelToDisplay.style.display = "block";
    };
  }
}

export default Home;
