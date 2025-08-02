/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

function throttle(fn, delay) {
  let lastCall = 0;
  let timeoutId = null;
  let lastArgs = null;

  return function throttled(...args) {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    } else {
      // Remplace la dernière tentative par la plus récente
      lastArgs = args;

      if (!timeoutId) {
        const timeRemaining = delay - (now - lastCall);
        timeoutId = setTimeout(() => {
          lastCall = Date.now();
          timeoutId = null;
          fn(...lastArgs);
          lastArgs = null;
        }, timeRemaining);
      }
    }
  };
}

module.exports = throttle;
