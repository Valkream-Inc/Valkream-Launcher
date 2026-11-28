/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Limite la fréquence des messages de progression envoyés à la fenêtre de mise à jour
 * (electron-updater en émet plusieurs dizaines par seconde) et borne la durée d'une promesse.
 */

/** Retourne un filtre : `true` si un message peut être émis (au plus un par `intervalMs`, le dernier passe toujours). */
export const createThrottle = (intervalMs: number, now: () => number = Date.now) => {
  let last = Number.NEGATIVE_INFINITY;
  return (force = false): boolean => {
    const t = now();
    if (!force && t - last < intervalMs) return false;
    last = t;
    return true;
  };
};

/** Rejette avec `Error(label)` si la promesse ne se résout pas dans `ms`. */
export const withTimeout = async <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(label)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
};
