/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

async function changePanel(id) {
  const newPanel = document.querySelector(`.${id}`);
  const oldPanel = document.querySelector(`.panel.active`);

  if (oldPanel && oldPanel !== newPanel) {
    oldPanel.classList.remove("active");
    oldPanel.classList.add("fade-out");

    // attendre la fin de la transition avant de reset
    oldPanel.addEventListener(
      "transitionend",
      () => {
        oldPanel.classList.remove("fade-out");
      },
      { once: true }
    );
  }

  newPanel.classList.add("active");
}

module.exports = { changePanel };
