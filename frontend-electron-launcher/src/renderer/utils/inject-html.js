/**
 * Injecte du HTML directement dans le body si l'id n'existe pas encore.
 * Supporte plusieurs éléments racines.
 */
function injectHTML(id = "", html = "") {
  if (!document.getElementById(id)) {
    const parent = document.body;

    // Crée un conteneur temporaire pour parser le HTML
    const template = document.createElement("template");
    template.innerHTML = html.trim(); // template.content contient tous les nœuds

    // Si un id est fourni, applique-le au premier élément racine
    if (id && template.content.firstElementChild) {
      template.content.firstElementChild.id = id;
    }

    // Injecte tous les nœuds dans le parent
    parent.appendChild(template.content);
  }
}

module.exports = injectHTML;
