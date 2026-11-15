/**
 * @author Valkream
 * @license MIT
 */

const fs = require("fs");
const path = require("path");
const progress = require("progress-stream");
const { Throttle } = require("stream-throttle");
const { formatBytes } = require("./formatBytes");
const { consoleStreamAnswer } = require("./consoleStreamAnswer");

/**
 * Copie un DOSSIER avec progression et throttling.
 *
 * @param {string} srcDir - Dossier source
 * @param {string} destDir - Dossier destination
 * @param {function} callback - (transferred, total, percent, speed) => {}
 */
const copyFolder = async (
  srcDir,
  destDir,
  callback = ({ transferredBytes, totalBytes, percent, speed }) =>
    consoleStreamAnswer(
      `📁 Copie du dossier ${path.basename(srcDir)}: ${percent}% ` +
        `(${formatBytes(transferredBytes)} / ${formatBytes(totalBytes)}) ` +
        `à ${formatBytes(speed)}/s`
    )
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // --- 1. Fonction pour calculer la taille totale du dossier ---
      const getTotalSize = (dir) => {
        let total = 0;
        const files = fs.readdirSync(dir, { withFileTypes: true });

        for (const file of files) {
          const filePath = path.join(dir, file.name);
          if (file.isDirectory()) {
            total += getTotalSize(filePath);
          } else {
            total += fs.statSync(filePath).size;
          }
        }
        return total;
      };

      const totalSize = getTotalSize(srcDir);
      let transferredBytes = 0;

      // --- 2. Prépare le dossier destination ---
      fs.mkdirSync(destDir, { recursive: true });

      // --- 3. Fonction récursive pour copier ---
      const copyRecursive = async (source, destination) => {
        const entries = fs.readdirSync(source, { withFileTypes: true });

        for (const entry of entries) {
          const srcPath = path.join(source, entry.name);
          const destPath = path.join(destination, entry.name);

          if (entry.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            await copyRecursive(srcPath, destPath);
          } else {
            await new Promise((resolveFile, rejectFile) => {
              const fileSize = fs.statSync(srcPath).size;

              const progressStream = progress({
                length: fileSize,
                time: 100,
              });

              progressStream.on("progress", (p) => {
                transferredBytes += p.delta; // Ajoute juste ce qui est transféré
                const percent = Math.round(
                  (transferredBytes / totalSize) * 100
                );

                callback({
                  transferredBytes,
                  totalBytes: totalSize,
                  percent,
                  speed: p.speed,
                });
              });

              fs.createReadStream(srcPath)
                .pipe(new Throttle({ rate: 1024 * 1024 * 1024 })) // 1024 Mo/s
                .pipe(progressStream)
                .pipe(fs.createWriteStream(destPath))
                .on("finish", resolveFile)
                .on("error", rejectFile);
            });
          }
        }
      };

      // --- 4. Lance la copie ---
      await copyRecursive(srcDir, destDir);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { copyFolder };
