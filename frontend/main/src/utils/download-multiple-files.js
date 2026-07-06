/**
 * @author Valkream Team
 * @license MIT-NC
 */

const axios = require("axios");
const fs = require("fs");
const { downloadFile } = require("./function/dowloadFile");

const pLimit = require("./p-limit");
const throttle = require("./throttle");
const createRateLimiter = require("./create-rate-limiter");

const dowloadMultiplefiles = async (
  files = [],
  callback = async () => {},
  maxParallelDownloads = 10,
  callbackTimeout = 100,
  maxDownloadsPerSecond = 100,
) => {
  const totalSizes = new Array(files.length).fill(0);
  const downloaded = new Array(files.length).fill(0);
  let totalGlobal = 0;
  let downloadedGlobal = 0;

  const startTime = Date.now();

  // 🔹 Signal d'annulation global pour couper court en cas d'échec d'une promesse
  const abortController = new AbortController();
  const { signal } = abortController;

  // 🔸 Étape 1 : Calcul des tailles totales
  await Promise.all(
    files.map(async (file, index) => {
      try {
        const head = await axios.head(file.url, { signal }); // Optionnel mais propre
        const size = parseInt(head.headers["content-length"], 10) || 0;
        totalSizes[index] = size;
        totalGlobal += size;
      } catch (err) {
        console.error(err, file.url);
      }
    }),
  );

  // 🔸 Étape 2 : Fonction de mise à jour de la progression
  const reportProgress = async () => {
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
  };

  const sendProgressThrottled = throttle(reportProgress, callbackTimeout);
  const rateLimiter = createRateLimiter(maxDownloadsPerSecond);
  const limit = pLimit(maxParallelDownloads);

  // 🔸 Étape 5 : Lancer les téléchargements avec suivi et écoute de l'abort signal
  const downloads = files.map((file, index) =>
    limit(async () => {
      // Si l'annulation a déjà été déclenchée par un autre fichier, on s'arrête direct
      if (signal.aborted) return;

      try {
        await rateLimiter().catch(() => {});

        // On passe le signal à la fonction unitaire
        await downloadFile(
          file.url,
          file.destPath,
          (downloadedBytes) => {
            downloaded[index] = downloadedBytes;
            downloadedGlobal = downloaded.reduce((a, b) => a + b, 0);
            sendProgressThrottled();
          },
          signal,
        );

        if (totalSizes[index] > 0) {
          downloaded[index] = totalSizes[index];
        } else {
          try {
            const stat = await fs.promises.stat(file.destPath);
            downloaded[index] = stat.size;
          } catch {}
        }

        downloadedGlobal = downloaded.reduce((a, b) => a + b, 0);
        await reportProgress();
      } catch (err) {
        // 💥 En cas d'erreur critique, on déclenche l'annulation globale immédiatement
        abortController.abort();
        throw err;
      }
    }),
  );

  // 🔸 Étape 6 : Attendre la fin ou intercepter la PREMIÈRE erreur qui crash
  try {
    return await Promise.all(downloads);
  } catch (error) {
    // On propage l'erreur au launcher pour la gestion d'UI (Bouton "reprendre")
    throw error;
  }
};

module.exports = dowloadMultiplefiles;
