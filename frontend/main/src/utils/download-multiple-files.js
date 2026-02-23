/**
 * @author Valkream Team
 * @license MIT-NC
 */

const got = require("got");
const { downloadFile } = require("./function/dowloadFile");

const pLimit = require("./p-limit");
const throttle = require("./throttle");
const createRateLimiter = require("./create-rate-limiter");

const dowloadMultiplefiles = async (
  files = [],
  callback = async () => {},
  maxParallelDownloads = 8,
  callbackTimeout = 100,
  maxDownloadsPerSecond = 100
) => {
  const totalSizes = new Array(files.length).fill(0);
  const downloaded = new Array(files.length).fill(0);
  let totalGlobal = 0;
  let downloadedGlobal = 0;

  const startTime = Date.now();

  // 🔸 Étape 1 : Calcul des tailles totales de tous les fichiers
  await Promise.all(
    files.map(async (file, index) => {
      try {
        const head = await got.head(file.url, {
          http2: true,
        });
        const size = parseInt(head.headers["content-length"], 10) || 0;
        totalSizes[index] = size;
        totalGlobal += size;
      } catch (err) {
        console.error(err, file.url);
      }
    })
  );

  // 🔸 Étape 2 : Fonction de mise à jour de la progression
  const sendProgressThrottled = throttle(async () => {
    if (totalGlobal === 0) return;
    const percent = Math.round((downloadedGlobal / totalGlobal) * 100);
    const elapsedSec = (Date.now() - startTime) / 1000;
    const speedGlobal = elapsedSec > 0 ? downloadedGlobal / elapsedSec : 0;

    await callback({
      percent,
      downloadedBytes: downloadedGlobal,
      totalBytes: totalGlobal,
      speed: speedGlobal,
    });
  }, callbackTimeout); // max X fois par seconde

  // 🔸 Étape 3 : Limitation du taux de démarrage des téléchargements
  const rateLimiter = createRateLimiter(maxDownloadsPerSecond);

  // 🔸 Étape 4 : Limitation de la parallélisation
  const limit = pLimit(maxParallelDownloads); // max de X téléchargements en parallèle

  // 🔸 Étape 5 : Lancer les téléchargement avec suivi
  const downloads = files.map((file, index) =>
    limit(async () => {
      // Attendre que le rate limiter autorise le démarrage
      await rateLimiter().catch(() => {});

      await downloadFile(file.url, file.destPath, (downloadedBytes) => {
        downloaded[index] = downloadedBytes;
        downloadedGlobal = downloaded.reduce((a, b) => a + b, 0);
        sendProgressThrottled();
      });
    })
  );

  // 🔸 Étape 6 : Attendre la fin
  return await Promise.all(downloads);
};

module.exports = dowloadMultiplefiles;
