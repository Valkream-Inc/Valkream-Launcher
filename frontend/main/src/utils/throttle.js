/**
 * @author Valkream Team
 * @license MIT-NC
 */

function throttle(fn, delay) {
  let lastCall = 0;
  let timeoutId = null;
  let lastArgs = null;

  return async function throttled(...args) {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      await fn(...args);
    } else {
      // Remplace la dernière tentative par la plus récente
      lastArgs = args;

      if (!timeoutId) {
        const timeRemaining = delay - (now - lastCall);
        timeoutId = setTimeout(async () => {
          lastCall = Date.now();
          timeoutId = null;
          await fn(...lastArgs);
          lastArgs = null;
        }, timeRemaining);
      }
    }
  };
}

module.exports = throttle;
