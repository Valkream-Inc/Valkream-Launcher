const archiver = require("archiver");
const fs = require("fs");
const path = require("path");

const { consoleStreamAnswer } = require("./consoleStreamAnswer");
const { formatBytes } = require("./formatBytes");

const zipFolder = async (
  sourceFolderPath,
  zipOutputPath,
  callback = (processedBytes, totalBytes, fileName, speed) =>
    consoleStreamAnswer(
      `🗜️  Compression ${path.basename(zipOutputPath)} : ${formatBytes(
        processedBytes
      )}`
    ),
  cancellationToken = { cancelled: false }
) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipOutputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    let totalBytes = 0;
    let processedBytes = 0;
    let currentFileName = "";
    let startTime = Date.now();
    let lastUpdateTime = startTime;
    let lastProcessedBytes = 0;

    // Calculer la taille totale avant de commencer
    const calculateTotalSize = (dirPath) => {
      let total = 0;
      const files = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          total += calculateTotalSize(fullPath);
        } else {
          try {
            total += fs.statSync(fullPath).size;
          } catch (err) {
            // Ignorer les erreurs de stat
          }
        }
      }
      return total;
    };

    try {
      totalBytes = calculateTotalSize(sourceFolderPath);
    } catch (err) {
      // Si on ne peut pas calculer la taille totale, on continue sans
      totalBytes = 0;
    }

    output.on("close", () => {
      if (!cancellationToken.cancelled) {
        resolve(archive.pointer());
      }
    });

    archive.on("error", (err) => {
      if (!cancellationToken.cancelled) {
        reject(err);
      }
    });

    archive.on("progress", (data) => {
      if (cancellationToken.cancelled) {
        archive.abort();
        return;
      }

      processedBytes = data.fs.processedBytes;

      // Calculer la vitesse
      const currentTime = Date.now();
      const timeDiff = (currentTime - lastUpdateTime) / 1000; // en secondes
      const bytesDiff = processedBytes - lastProcessedBytes;
      const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;

      callback(processedBytes, totalBytes, currentFileName, speed);

      lastUpdateTime = currentTime;
      lastProcessedBytes = processedBytes;
    });

    archive.on("entry", (entry) => {
      if (cancellationToken.cancelled) {
        archive.abort();
        return;
      }

      currentFileName = entry.name;
      callback(processedBytes, totalBytes, currentFileName, 0);
    });

    archive.pipe(output);
    archive.directory(sourceFolderPath, false);
    archive.finalize();
  });
};

module.exports = { zipFolder };
