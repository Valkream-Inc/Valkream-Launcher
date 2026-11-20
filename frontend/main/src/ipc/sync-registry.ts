/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Registre des synchronisations en cours (une par dossier d'installation).
 * Une nouvelle synchro stoppe d'abord l'ancienne (bloquée ou plantée) pour pouvoir
 * reprendre / recommencer immédiatement ; tout est coupé à la fermeture de l'application.
 */

interface RunningSync {
  controller: AbortController;
  done: Promise<unknown>;
}

/** Délai maximal d'attente de l'arrêt d'une synchro précédente (ms). */
const STOP_TIMEOUT = 5000;

const running = new Map<string, RunningSync>();

const stop = async (entry: RunningSync, timeoutMs: number): Promise<void> => {
  entry.controller.abort();
  await Promise.race([entry.done.catch(() => undefined), new Promise((resolve) => setTimeout(resolve, timeoutMs))]);
};

/**
 * Lance `task` pour cette installation : une synchro déjà active est annulée puis attendue.
 * Le signal fourni à `task` est annulé par `cancelSync`, `abortAllSyncs` ou une relance.
 */
export const runSync = async <T>(
  key: string,
  task: (signal: AbortSignal) => Promise<T>,
  timeoutMs = STOP_TIMEOUT,
): Promise<T> => {
  const previous = running.get(key);
  if (previous) await stop(previous, timeoutMs);

  const controller = new AbortController();
  const done = task(controller.signal);
  const entry: RunningSync = { controller, done };
  running.set(key, entry);
  try {
    return await done;
  } catch (error) {
    controller.abort(); // plantage : on coupe tout ce qui pourrait encore tourner derrière
    throw error;
  } finally {
    if (running.get(key) === entry) running.delete(key);
  }
};

export const cancelSync = (key: string): void => running.get(key)?.controller.abort();

export const isSyncRunning = (key: string): boolean => running.has(key);

/** Coupe toutes les synchros (fermeture de l'application, erreur fatale). */
export const abortAllSyncs = (): void => {
  for (const entry of running.values()) entry.controller.abort();
};
