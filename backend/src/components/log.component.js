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

const log = (user, processus, value) => {
  let message = "";
  const currentDate = new Date();

  // Les couleurs définies avec Chalk
  const error = chalk.bgRed.white.bold;
  const success = chalk.green.bold;
  const warning = chalk.hex("#FFA500"); // Couleur orange

  // Convertir value en chaîne si ce n'est pas déjà une chaîne
  const valueString = String(value);

  // Vérifier le type de message
  if (valueString.startsWith("error_")) {
    message = error(valueString);
  } else if (valueString.startsWith("warning_")) {
    console.log(" ");
    message = warning(valueString);
  } else if (valueString.startsWith("success_")) {
    message = success(valueString);
  } else {
    message = chalk.white(valueString); // Si ce n'est pas une valeur reconnue, afficher comme normal
  }

  // Formatage pour un affichage en colonnes alignées
  const dateColumn = chalk.white(currentDate.toGMTString()) + "     ";
  const userColumn = chalk.blue(resize_to(30, user || "unknown")) + "     ";
  const processColumn =
    chalk.yellow(resize_to(25, processus || "unknown")) + "     ";
  const messageColumn = message;

  // Afficher les informations formatées
  if (valueString.startsWith("warning_")) {
    console.log(`${dateColumn}${userColumn}${processColumn}${messageColumn}`);
  } else {
    if (process.env.LOG == "true") {
      console.log(`${dateColumn}${userColumn}${processColumn}${messageColumn}`);
    }
  }
};

module.exports = log;
