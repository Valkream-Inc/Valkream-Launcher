/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Limite la charge sur une API distante : au plus `concurrency` appels en même temps, au moins
 * `intervalMs` entre deux départs, et nouvelle tentative (avec `Retry-After` quand le serveur le donne)
 * sur un « 429 Too Many Requests » pour ne pas se faire bloquer.
 */

import { HttpError } from "./http.js";

export interface LimitOptions {
  /** Appels simultanés au plus (défaut : 4). */
  concurrency?: number;
  /** Délai minimal entre deux départs d'appel, en ms (défaut : 120). */
  intervalMs?: number;
  /** Nouvelles tentatives sur 429 (défaut : 4). */
  retries?: number;
  /** Attente de base avant une nouvelle tentative sans `Retry-After`, doublée à chaque essai (défaut : 1000 ms). */
  backoffMs?: number;
  /** Attente maximale entre deux tentatives (défaut : 15 s). */
  maxWaitMs?: number;
  /** Injectable pour les tests. */
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Exécute `task` pour chaque élément, avec la limite de charge demandée ; l'ordre du résultat suit celui de `items`. */
export const mapLimited = async <T, R>(
  items: readonly T[],
  task: (item: T, index: number) => Promise<R>,
  options: LimitOptions = {},
): Promise<R[]> => {
  const { concurrency = 4, intervalMs = 120, retries = 4, backoffMs = 1000, maxWaitMs = 15_000, sleep = defaultSleep } = options;
  const results = new Array<R>(items.length);
  let next = 0;
  let nextStart = 0; // horodatage du prochain départ autorisé

  const run = async (item: T, index: number): Promise<R> => {
    for (let attempt = 0; ; attempt++) {
      // Départs espacés (la file d'attente est partagée entre les travailleurs)
      const now = Date.now();
      const wait = Math.max(0, nextStart - now);
      nextStart = Math.max(now, nextStart) + intervalMs;
      if (wait > 0) await sleep(wait);
      try {
        return await task(item, index);
      } catch (error) {
        if (!(error instanceof HttpError) || error.status !== 429 || attempt >= retries) throw error;
        await sleep(Math.min(maxWaitMs, error.retryAfterMs ?? backoffMs * 2 ** attempt));
      }
    }
  };

  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await run(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, worker));
  return results;
};
