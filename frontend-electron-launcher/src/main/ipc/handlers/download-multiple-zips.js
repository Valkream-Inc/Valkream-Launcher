/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const axios = require("axios");
const { downloadZip } = require("valkream-function-lib");

class DowloadMultiplefiles {
  async init(event, files, id) {
    this.event = event;
    this.files = files;
    this.id = id;

    // files: tableau [{ path, destPath }]
    const totalSizes = new Array(this.files.length).fill(0);
    const downloaded = new Array(this.files.length).fill(0);
    const speeds = new Array(this.files.length).fill(0);
    let totalGlobal = 0;
    let downloadedGlobal = 0;
    let speedGlobal = 0;

    // 1. Préparation : récupérer les tailles
    await Promise.all(
      this.files.map(async (file, index) => {
        const head = await axios.head(file.url);
        const size = parseInt(head.headers["content-length"], 10);
        totalSizes[index] = size;
        totalGlobal += size;
      })
    );

    // 2. Lancement des téléchargements en parallèle
    const downloads = this.files.map((file, index) => {
      return new Promise(async (resolve, reject) => {
        try {
          await downloadZip(
            file.url,
            file.destPath,
            (downloadedBytes, totalBytes, pourcentageDuFichier, speed) => {
              downloaded[index] = downloadedBytes;
              speeds[index] = speed;
              downloadedGlobal = downloaded.reduce((a, b) => a + b, 0);
              speedGlobal = speeds.reduce((a, b) => a + b, 0);
              const percent = Math.round(
                (downloadedGlobal / totalGlobal) * 100
              );

              this.event.sender.send(`download-multi-progress-${this.id}`, {
                percent,
                downloadedBytes: downloadedGlobal,
                totalBytes: totalGlobal,
                speed: speedGlobal,
              });
            }
          );
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    // 3. Attente de tous les téléchargements
    return Promise.all(downloads);
  }
}

module.exports = DowloadMultiplefiles;
