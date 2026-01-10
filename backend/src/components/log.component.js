/**
 * @author Valkream Team
 * @license MIT-NC
 */

const chalk = require("chalk");

const SHOW_QUERY_PARAMS = false;

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

  // Séparer le processus en deux parties : avant et après le "?"
  let processValue = processus || "unknown";

  // Si la config est false, masquer les paramètres de requête
  if (!SHOW_QUERY_PARAMS) {
    const questionMarkIndex = processValue.indexOf("?");
    if (questionMarkIndex !== -1) {
      processValue = processValue.slice(0, questionMarkIndex);
    }
  }

  const resizedProcess = resize_to(70, processValue);
  const questionMarkIndex = resizedProcess.indexOf("?");

  let processColumn;
  if (questionMarkIndex !== -1) {
    const resizedBeforeQuestion = resizedProcess.slice(0, questionMarkIndex);
    const resizedAfterQuestion = resizedProcess.slice(questionMarkIndex);
    processColumn =
      chalk.bold.bgBlack(resizedBeforeQuestion) +
      chalk.green(resizedAfterQuestion) +
      "     ";
  } else {
    processColumn = chalk.bold.bgBlack(resizedProcess) + "     ";
  }

  // Afficher les informations formatées
  console.log(`${dateColumn}${userColumn}${processColumn}`);
};

module.exports = log;
