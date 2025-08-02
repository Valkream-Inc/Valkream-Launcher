/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const fs = require("fs");
const { unZip } = require("valkream-function-lib");
const { pLimit, throttle } = require("../../utils/main-utils");

class MultipleUnzip {
  async init(event, zips, id) {
    this.event = event;
    this.zips = zips;
    this.id = id;

    const count = zips.length;
    const totalSizes = new Array(count).fill(0);
    const decompressed = new Array(count).fill(0);
    const speeds = new Array(count).fill(0);
    let totalGlobal = 0;
    let decompressedGlobal = 0;

    const startTime = Date.now();

    // 🔸 Étape 1 : Calcul des tailles totales des fichiers zip
    await Promise.all(
      zips.map(async (zip, index) => {
        try {
          const { size } = await fs.promises.lstat(zip.path);
          totalSizes[index] = size;
          totalGlobal += size;
        } catch (err) {
          console.warn(
            `Impossible de lire la taille de ${zip.path}: ${err.message}`
          );
        }
      })
    );

    // 🔸 Étape 2 : Fonction de mise à jour de la progression
    const sendProgressThrottled = throttle(() => {
      if (totalGlobal === 0) return; // éviter division par zéro
      const percent = Math.round((decompressedGlobal / totalGlobal) * 100);
      const elapsedSec = (Date.now() - startTime) / 1000;
      const speedGlobal = elapsedSec > 0 ? decompressedGlobal / elapsedSec : 0;

      event.sender.send(`multi-unzip-progress-${id}`, {
        percent,
        decompressedBytes: decompressedGlobal,
        totalBytes: totalGlobal,
        speed: speedGlobal,
      });
    }, 100); // max 10x/s

    // 🔸 Étape 3 : Limitation de la parallélisation
    const limit = pLimit(10); // max 10 décompressions en parallèle

    // 🔸 Étape 4 : Lancer les décompressions avec suivi
    const tasks = zips.map((zip, index) =>
      limit(async () => {
        try {
          await unZip(
            zip.path,
            zip.destPath,
            (decompressedBytes, totalBytes, _, speed) => {
              const progressPercent = decompressedBytes / totalBytes;
              decompressed[index] = progressPercent * totalSizes[index];
              speeds[index] = speed;
              decompressedGlobal = decompressed.reduce((a, b) => a + b, 0);
              sendProgressThrottled();
            }
          );
        } catch (err) {
          console.error(`Erreur lors de la décompression de ${zip.path}:`, err);
          event.sender.send(`multi-unzip-error-${id}`, {
            file: zip.path,
            error: err.message,
          });
        }
      })
    );

    // 🔸 Étape 5 : Attendre la fin
    await Promise.all(tasks);

    event.sender.send(`multi-unzip-finished-${id}`);
  }
}

module.exports = MultipleUnzip;
