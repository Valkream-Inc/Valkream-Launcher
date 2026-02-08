/**
 * @author Valkream Team
 * @license MIT-NC
 */

/**
 * Fonction utilitaire : attendre la prochaine seconde
 * @returns {Promise} Promesse résolue au début de la prochaine seconde
 */
const waitNextSecond = () => {
  const now = Date.now();
  const msToNextSecond = 1000 - (now % 1000);
  return new Promise(resolve => setTimeout(resolve, msToNextSecond));
};

/**
 * Crée un rate limiter qui limite le nombre d'actions par seconde
 * @param {number} maxPerSecond - Nombre maximum d'actions par seconde
 * @returns {Function} Fonction qui retourne une promesse résolue quand l'action peut être exécutée
 */
function createRateLimiter(maxPerSecond) {
  if (!maxPerSecond || maxPerSecond <= 0) {
    // Pas de limitation
    return () => Promise.resolve();
  }

  // Compteur global pour cette instance du rate limiter
  let currentSecond = Math.floor(Date.now() / 1000);
  let startedThisSecond = 0;

  /**
   * Fonction de contrôle avant chaque lancement
   * @returns {Promise} Promesse résolue quand un slot est disponible
   */
  const rateLimitStart = async () => {
    while (true) {
      const nowSec = Math.floor(Date.now() / 1000);

      // Nouvelle seconde → reset
      if (nowSec !== currentSecond) {
        currentSecond = nowSec;
        startedThisSecond = 0;
      }

      // Slot dispo
      if (startedThisSecond < maxPerSecond) {
        startedThisSecond++;
        return;
      }

      // Limite atteinte → attendre la seconde suivante
      await waitNextSecond();
    }
  };

  return () => rateLimitStart();
}

module.exports = createRateLimiter;