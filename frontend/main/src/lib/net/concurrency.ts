/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Exécute `worker` sur chaque élément avec au plus `limit` tâches en parallèle.
 * À la première erreur, plus aucune nouvelle tâche ne démarre ; les tâches en cours
 * se terminent, puis l'erreur est relancée.
 */
export const runPool = async <T>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> => {
  let next = 0;
  let failure: { error: unknown } | undefined;

  const lane = async (): Promise<void> => {
    while (!failure && next < items.length) {
      const index = next++;
      try {
        await worker(items[index], index);
      } catch (error) {
        failure ??= { error };
      }
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, lane));
  if (failure) throw failure.error;
};
