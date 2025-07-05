import { changePage } from "./utils/utils.js";
import HomeGameManager from "./home-game-manager.js";

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
    new HomeGameManager().init();
  }

  initButtons() {
    this.title.addEventListener("click", () => {
      this.changeStep(0, this.title);
    });

    this.btnGame.addEventListener("click", () => {
      this.changeStep(1, this.btnGame);
    });

    this.btnLauncher.addEventListener("click", () => {
      this.changeStep(2, this.btnLauncher);
    });

    this.btnEvent.addEventListener("click", () => {
      this.changeStep(3, this.btnEvent);
    });

    this.btnSettings.addEventListener("click", () => {
      changePage("config");
    });
  }

  changeStep(step, btn) {
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
}

export default Home;
