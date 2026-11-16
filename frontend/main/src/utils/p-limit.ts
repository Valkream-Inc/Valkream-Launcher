/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { LimitFunction } from "../types/utils";

function pLimit(concurrency: number): LimitFunction {
  let activeCount = 0;
  const queue: {
    fn: () => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
  }[] = [];

  const next = (): void => {
    if (queue.length === 0 || activeCount >= concurrency) return;

    const { fn, resolve, reject } = queue.shift()!;
    activeCount++;

    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        activeCount--;
        next(); // lancer la suivante dans la file
      });
  };

  return <T>(fn: () => Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      queue.push({
        fn,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      next(); // essaye d'exécuter immédiatement si possible
    });
}

export default pLimit;
