const axios = require("axios");
const fs = require("fs");
const progress = require("progress-stream");
const { Throttle } = require("stream-throttle");

const { formatBytes } = require("./formatBytes");
const { consoleStreamAnswer } = require("./consoleStreamAnswer");

const downloadZip = (
  downloadUrl,
  destPath,
  callback = (downloadedBytes, totalBytes, percent, speed) =>
    consoleStreamAnswer(
      `📥 Téléchargement du zip vers ${destPath}: ${percent}% (${formatBytes(
        downloadedBytes
      )} / ${formatBytes(totalBytes)}) à ${formatBytes(speed)}/s`
    )
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { data, headers } = await axios({
        url: downloadUrl,
        method: "GET",
        responseType: "stream",
      });

      const totalSize = parseInt(headers["content-length"], 10);

      const progressStream = progress({
        length: totalSize,
        time: 100,
      });

      progressStream.on("progress", (p) => {
        callback(p.transferred, totalSize, Math.round(p.percentage), p.speed);
      });

      data
        .pipe(new Throttle({ rate: 512 * 1024 * 1024 })) // 0.5 Go/s
        .pipe(progressStream)
        .pipe(fs.createWriteStream(destPath))
        .on("finish", resolve)
        .on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { downloadZip };
