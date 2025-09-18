/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const fs = require("fs");
const { unZip } = require("./function/unZip");

const pLimit = require("./p-limit");
const throttle = require("./throttle");

const unZipMultipleFiles = async (
  zips = [],
  callback = async () => {},
  maxParallelUnzips = 10,
  callbackTimeout = 100
) => {
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
      const { size } = await fs.promises.lstat(zip.path);
      totalSizes[index] = size;
      totalGlobal += size;
    })
  );

  // 🔸 Étape 2 : Fonction de mise à jour de la progression
  const sendProgressThrottled = throttle(async () => {
    if (totalGlobal === 0) return; // éviter division par zéro
    const percent = Math.round((decompressedGlobal / totalGlobal) * 100);
    const elapsedSec = (Date.now() - startTime) / 1000;
    const speedGlobal = elapsedSec > 0 ? decompressedGlobal / elapsedSec : 0;

    await callback({
      percent,
      decompressedBytes: decompressedGlobal,
      totalBytes: totalGlobal,
      speed: speedGlobal,
    });
  }, callbackTimeout); // max X fois par seconde

  // 🔸 Étape 3 : Limitation de la parallélisation
  const limit = pLimit(maxParallelUnzips); // max de X décompressions en parallèle

  // 🔸 Étape 4 : Lancer les décompressions avec suivi
  const tasks = zips.map((zip, index) =>
    limit(async () => {
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
    })
  );

  // 🔸 Étape 5 : Attendre la fin
  return await Promise.all(tasks);
};

module.exports = unZipMultipleFiles;
