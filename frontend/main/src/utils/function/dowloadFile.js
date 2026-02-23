/**
 * @author Valkream Team
 * @license MIT-NC
 */

let got;

const getGot = async () => {
  if (!got) {
    const gotModule = await import("got");
    got = gotModule.default || gotModule;
  }
  return got;
};
const fs = require("fs");
const path = require("path");
const progress = require("progress-stream");
const { Throttle } = require("stream-throttle");

const { formatBytes } = require("./formatBytes");
const { consoleStreamAnswer } = require("./consoleStreamAnswer");

const downloadFile = (
  downloadUrl,
  destPath,
  callback = (downloadedBytes, totalBytes, percent, speed) =>
    consoleStreamAnswer(
      `📥 Téléchargement du fichier ${path.basename(destPath)} : ${percent}% ` +
        `(${formatBytes(downloadedBytes)} / ${formatBytes(totalBytes)}) ` +
        `à ${formatBytes(speed)}/s`
    )
) => {
  return new Promise(async (resolve, reject) => {
    let writer;

    try {
      const gotClient = await getGot();

      const downloadStream = gotClient.stream(downloadUrl, {
        http2: true,
        headers: {
          "accept-encoding": "identity", // évite les soucis gzip
        },
        retry: {
          limit: 5,
          calculateDelay: ({ attemptCount }) => attemptCount * 1000,
        },
      });

      downloadStream.on("retry", (retryCount, error, retryOptions) => {
        console.error(
          `⚠️ Tentative de retry ${retryCount}/5 pour ${downloadUrl}:`,
          error.message || error.code || error
        );
      });

      const contentLengthHeader =
        (downloadStream.headers && downloadStream.headers["content-length"]) ||
        undefined;
      const totalSize = contentLengthHeader
        ? parseInt(contentLengthHeader, 10)
        : 0;

      const progressStream = progress({
        length: totalSize,
        time: 100,
      });

      progressStream.on("progress", (p) => {
        callback(p.transferred, totalSize, Math.round(p.percentage), p.speed);
      });

      await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
      writer = fs.createWriteStream(destPath);

      downloadStream
        .pipe(new Throttle({ rate: 1024 * 1024 * 1024 })) // 1 Go/s
        .pipe(progressStream)
        .pipe(writer);

      writer.on("finish", resolve);
      writer.on("error", reject);

      downloadStream.on("error", (err) => {
        if (writer) writer.destroy();
        reject(err);
      });
    } catch (err) {
      if (writer) writer.destroy();
      reject(err);
    }
  });
};

module.exports = { downloadFile };
