const consoleStreamAnswer = async (logToDisplay) => {
  return new Promise((resolve) => {
    const log = `${logToDisplay}..........................................`;
    process.stdout.write(`\r${log}`);
    resolve();
  });
};

module.exports = { consoleStreamAnswer };
