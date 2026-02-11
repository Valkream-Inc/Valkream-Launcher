/**
 * @author Valkream Team
 * @license MIT-NC
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const progress = require("progress-stream");
const { Throttle } = require("stream-throttle");
const axiosRetry = require("axios-retry").default;

const { formatBytes } = require("./formatBytes");
const { consoleStreamAnswer } = require("./consoleStreamAnswer");

/* ----------------- AXIOS CONFIG SAFE ----------------- */

axiosRetry(axios, {
  retries: 5,
  retryDelay: (retryCount) => retryCount * 1000,
  // retryCondition: (error) =>
  //   error.code === "ECONNRESET" ||
  //   error.code === "ETIMEDOUT" ||
  //   error.code === "EPIPE",
  onRetry: (retryCount, error, requestConfig) => {
    // Log les erreurs de retry (sauf la dernière qui sera propagée)
    console.error(
      `⚠️ Tentative de retry ${retryCount}/5 pour ${
        requestConfig.url || requestConfig.baseURL
      }:`,
      error.message || error.code || error
    );
  },
});

/* ---------------------------------------------------- */

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
      const response = await axios({
        url: downloadUrl,
        method: "GET",
        responseType: "stream",
        timeout: 0,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          "Accept-Encoding": "identity", // évite les soucis gzip
        },
      });

      const totalSize = parseInt(response.headers["content-length"] || 0, 10);

      const progressStream = progress({
        length: totalSize,
        time: 100,
      });

      progressStream.on("progress", (p) => {
        callback(p.transferred, totalSize, Math.round(p.percentage), p.speed);
      });

      await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
      writer = fs.createWriteStream(destPath);

      response.data
        .pipe(new Throttle({ rate: 512 * 1024 * 1024 })) // 0.5 Go/s
        .pipe(progressStream)
        .pipe(writer);

      writer.on("finish", resolve);
      writer.on("error", reject);

      response.data.on("error", reject);
    } catch (err) {
      if (writer) writer.destroy();
      reject(err);
    }
  });
};

module.exports = { downloadFile };
