/**
 * @author Valkream Team
 * @license MIT-NC
 */

const consoleStreamAnswer = async (logToDisplay: string): Promise<void> => {
  return new Promise((resolve) => {
    const log = `${logToDisplay}                      `;
    process.stdout.write(`\r${log}`);
    resolve();
  });
};

export { consoleStreamAnswer };
