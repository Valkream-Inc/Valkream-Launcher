const readline = require("readline");

const consoleQuestion = async (question) => {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(`${question} `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

module.exports = { consoleQuestion };
