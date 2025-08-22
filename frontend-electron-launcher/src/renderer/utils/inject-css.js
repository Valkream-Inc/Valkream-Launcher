/**
 * Injecte du CSS directement dans un <style> si ce n'est pas déjà présent
 * @param {string} [id] - Optionnel, un id pour éviter les doublons
 * @param {string} cssText - Le contenu CSS à injecter
 */
function injectCSS(id, cssText) {
  // Vérifie si déjà présent via l'id ou le contenu
  if (id && document.getElementById(id)) {
    console.log(`CSS déjà injecté : ${id}`);
    return;
  }

  const alreadyLoaded = Array.from(document.querySelectorAll("style")).some(
    (style) => style.textContent === cssText
  );

  if (alreadyLoaded) {
    console.log("CSS déjà injecté (contenu identique)");
    return;
  }

  // Crée le <style> et l'ajoute au <head>
  const style = document.createElement("style");
  if (id) style.id = id;
  style.textContent = cssText;
  document.head.appendChild(style);

  console.log("CSS injecté via <style>");
}

module.exports = injectCSS;
