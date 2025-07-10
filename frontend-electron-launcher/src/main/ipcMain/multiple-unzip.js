/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { unZip } = require("valkream-function-lib");

class MultipleUnzip {
  async init(event, zips) {
    this.event = event;
    this.zips = zips;
    // zips: tableau [{ path, destPath }]
    const totalSizes = new Array(this.zips.length).fill(0);
    const decompressed = new Array(this.zips.length).fill(0);
    const speeds = new Array(this.zips.length).fill(0);
    let totalGlobal = 0;
    let decompressedGlobal = 0;
    let speedGlobal = 0;

    // 1. Lancement des décompressions en parallèle
    const decompressions = this.zips.map((zip, index) => {
      return new Promise(async (resolve, reject) => {
        try {
          await unZip(
            zip.path,
            zip.destPath,
            (decompressedBytes, totalBytes, pourcentageDuFichier, speed) => {
              decompressed[index] = decompressedBytes;
              totalSizes[index] = totalBytes;
              speeds[index] = speed;
              decompressedGlobal = decompressed.reduce((a, b) => a + b, 0);
              speedGlobal = speeds.reduce((a, b) => a + b, 0);
              totalGlobal = totalSizes.reduce((a, b) => a + b, 0);
              const percent = Math.round(
                (decompressedGlobal / totalGlobal) * 100
              );

              this.event.sender.send("multi-unzip-progress", {
                percent,
                decompressedBytes: decompressedGlobal,
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

    // 2. Attente de tous les téléchargements
    return Promise.all(decompressions);
  }
}

module.exports = MultipleUnzip;
