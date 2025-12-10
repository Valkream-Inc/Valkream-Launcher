/**
 * @author Valkream Team
 * @license MIT-NC
 */

const chalk = require("chalk");

function resize_to(size, value) {
  // Si la chaîne est plus longue que la taille donnée, on la tronque
  if (value.length > size) {
    return value.slice(0, size); // Tronquer la chaîne
  }

  // Sinon, on complète avec des espaces
  let message = value;
  for (let i = value.length; i < size; i++) {
    message += " "; // Ajouter des espaces pour atteindre la taille spécifiée
  }

  return message;
}

const log = (user, processus) => {
  const currentDate = new Date();

  // Formatage pour un affichage en colonnes alignées
  const dateColumn = chalk.yellow(currentDate.toGMTString()) + "     ";
  const userColumn = chalk.blue(resize_to(20, user || "unknown")) + "     ";
  const processColumn =
    chalk.bold.bgBlack(resize_to(70, processus || "unknown")) + "     ";

  // Afficher les informations formatées
  console.log(`${dateColumn}${userColumn}${processColumn}`);
};

module.exports = log;
