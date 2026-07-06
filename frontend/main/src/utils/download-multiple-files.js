/**
 * @author Valkream Team
 * @license MIT-NC
 */

const axios = require("axios");
const fs = require("fs");
const { downloadFile, isNetworkError } = require("./function/dowloadFile");

const pLimit = require("./p-limit");
const throttle = require("./throttle");
const createRateLimiter = require("./create-rate-limiter");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

  // 🔸 Fonction utilitaire pour récupérer la taille avec le système de retry identique
  const getFileSizeWithRetry = async (url) => {
    let otherRetryCount = 0;
    const MAX_OTHER_RETRIES = 3;

    while (true) {
      if (signal?.aborted) {
        throw new Error(`Head request aborted for ${url}`);
      }

      try {
        const head = await axios.head(url, { signal });
        return parseInt(head.headers["content-length"], 10) || 0;
      } catch (err) {
        // Pas de retry si c'est une annulation volontaire
        if (signal?.aborted || err.message?.includes("aborted")) {
          throw err;
        }

        // Retry infini sur erreur réseau
        if (isNetworkError(err)) {
          console.log(
            `⚠️  Erreur réseau ${err.message || err.code} (HEAD) pour ${url}, reprise...`,
          );
          await sleep(1000); // Léger délai pour éviter de spammer en boucle fermée
          continue;
        }

        // Retry limité pour les autres types d'erreurs
        if (otherRetryCount < MAX_OTHER_RETRIES) {
          otherRetryCount++;
          const delay = otherRetryCount * 1000;
          console.log(
            `⚠️  Tentative ${err.message || err.code} (HEAD) ${otherRetryCount}/${MAX_OTHER_RETRIES} pour ${url}...`,
          );
          await sleep(delay);
          continue;
        }

        // Si on a épuisé les retries hors-réseau, on propage l'erreur
        throw err;
      }
    }
  };

  // 🔸 Étape 1 : Calcul des tailles totales (avec retry sécurisé)
  try {
    await Promise.all(
      files.map(async (file, index) => {
        // On passe par la fonction robuste avec retry
        const size = await getFileSizeWithRetry(file.url);
        totalSizes[index] = size;
        totalGlobal += size;
      }),
    );
  } catch (err) {
    // Si l'une des requêtes HEAD échoue définitivement (ex: 404), on annule tout le process
    console.error(
      "💥 Échec critique lors de la récupération des tailles:",
      err.message,
    );
    abortController.abort();
    throw err;
  }

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
