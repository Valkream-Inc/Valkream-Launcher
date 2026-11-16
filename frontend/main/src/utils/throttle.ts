/**
 * @author Valkream Team
 * @license MIT-NC
 */

function throttle<A extends unknown[]>(
  fn: (...args: A) => Promise<void> | void,
  delay: number
): (...args: A) => Promise<void> {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: A | null = null;

  return async function throttled(...args: A): Promise<void> {
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
          await fn(...(lastArgs as A));
          lastArgs = null;
        }, timeRemaining);
      }
    }
  };
}

export default throttle;
