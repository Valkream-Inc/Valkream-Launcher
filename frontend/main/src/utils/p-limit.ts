/**
 * @author Valkream Team
 * @license MIT-NC
 */

function pLimit(concurrency) {
  let activeCount = 0;
  const queue = [];

  const next = () => {
    if (queue.length === 0 || activeCount >= concurrency) return;

    const { fn, resolve, reject } = queue.shift();
    activeCount++;

    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        activeCount--;
        next(); // lancer la suivante dans la file
      });
  };

  return (fn) =>
    new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      next(); // essaye d'exécuter immédiatement si possible
    });
}

module.exports = pLimit;
