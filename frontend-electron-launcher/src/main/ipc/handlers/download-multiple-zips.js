/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const axios = require("axios");
const { downloadZip } = require("valkream-function-lib");
const { pLimit, throttle } = require("../../utils/main-utils");

class DowloadMultiplefiles {
  async init(event, files, id) {
    this.event = event;
    this.files = files;
    this.id = id;

    const totalSizes = new Array(this.files.length).fill(0);
    const downloaded = new Array(this.files.length).fill(0);
    let totalGlobal = 0;
    let downloadedGlobal = 0;

    const startTime = Date.now();

    // 🔸 Étape 1 : Calcul des tailles totales de tous les fichiers
    await Promise.all(
      this.files.map(async (file, index) => {
        try {
          const head = await axios.head(file.url);
          const size = parseInt(head.headers["content-length"], 10);
          totalSizes[index] = size;
          totalGlobal += size;
        } catch (err) {
          console.warn(
            `Erreur récupération taille de ${file.url}: ${err.message}`
          );
        }
      })
    );

    // 🔸 Étape 2 : Fonction de mise à jour de la progression
    const sendProgressThrottled = throttle(() => {
      if (totalGlobal === 0) return;
      const percent = Math.round((downloadedGlobal / totalGlobal) * 100);
      const elapsedSec = (Date.now() - startTime) / 1000;
      const speedGlobal = elapsedSec > 0 ? downloadedGlobal / elapsedSec : 0;

      this.event.sender.send(`download-multi-progress-${this.id}`, {
        percent,
        downloadedBytes: downloadedGlobal,
        totalBytes: totalGlobal,
        speed: speedGlobal,
      });
    }, 100); // max 10x par seconde

    // 🔸 Étape 3 : Limitation de la parallélisation
    const limit = pLimit(3); // max 3 téléchargements en parallèle

    // 🔸 Étape 4 : Lancer les téléchargement avec suivi
    const downloads = this.files.map((file, index) =>
      limit(async () => {
        await downloadZip(file.url, file.destPath, (downloadedBytes) => {
          downloaded[index] = downloadedBytes;
          downloadedGlobal = downloaded.reduce((a, b) => a + b, 0);
          sendProgressThrottled();
        });
      })
    );

    // 🔸 Étape 5 : Attendre la fin
    await Promise.all(downloads);

    this.event.sender.send(`download-multi-finished-${this.id}`);
  }
}

module.exports = DowloadMultiplefiles;
