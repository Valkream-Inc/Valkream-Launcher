import { changePanel } from "../utils/utils.js";

class Home {
  static id = "home";

  async init() {
    this.step = 0;
    console.log("Initializing Home Panel...");
    this.initButtons();
  }

  initButtons() {
    const title = document.querySelector(".topbar-title");
    title.addEventListener("click", () => {
      this.changeStep(0);
    });

    const btnGame = document.getElementById("btn-game");
    btnGame.addEventListener("click", () => {
      this.changeStep(1);
    });

    const btnLauncher = document.getElementById("btn-launcher");
    btnLauncher.addEventListener("click", () => {
      this.changeStep(2);
    });

    const btnEvent = document.getElementById("btn-event");
    btnEvent.addEventListener("click", () => {
      this.changeStep(3);
    });

    const btnSettings = document.getElementById("btn-settings");
    btnSettings.addEventListener("click", () => {
      changePanel("config");
    });
  }

  changeStep(step) {
    this.step = step;
    const steps = document.querySelectorAll(".home-content-step");
    steps.forEach((step) => {
      step.style.display = "none";
    });
    document.getElementById(`home-content-step-${step}`).style.display =
      "block";
  }
}

export default Home;
