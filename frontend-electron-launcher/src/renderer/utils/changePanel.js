async function changePanel(id) {
  let panel = document.querySelector(`.${id}`);
  let active = document.querySelector(`.active`);
  if (active) active.classList.toggle("active");
  panel.classList.add("active");
}

module.exports = { changePanel };
