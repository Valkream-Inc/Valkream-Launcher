const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const progress = require("progress-stream");
const path = require("path");
const { Throttle } = require("stream-throttle");

const { apiKey, apiToken } = require("../../secured_config.js");
const { consoleStreamAnswer } = require("./consoleStreamAnswer");
const { formatBytes } = require("./formatBytes");

const sendZip = (
  zipPath,
  uploadUrl,
  callback = (processedBytes, totalBytes, percent, speed) =>
    consoleStreamAnswer(
      `📤 Envoi du zip ${zipPath}: ${percent}% (${formatBytes(
        processedBytes
      )} / ${formatBytes(totalBytes)}) à ${formatBytes(speed)}/s`
    ),
  customApiKey = apiKey,
  customApiToken = apiToken
) => {
  return new Promise((resolve, reject) => {
    const fileSize = fs.statSync(zipPath).size;

    const progressStream = progress({
      length: fileSize,
      time: 100,
    });

    progressStream.on("progress", (p) => {
      callback(p.transferred, fileSize, Math.round(p.percentage), p.speed);
    });

    const form = new FormData();
    form.append(
      "file",
      fs
        .createReadStream(zipPath)
        .pipe(new Throttle({ rate: 512 * 1024 * 1024 })) // 0.5 Go/s
        .pipe(progressStream),
      {
        filename: path.basename(zipPath),
      }
    );
    form.append("api_token", customApiToken);
    form.append("api_key", customApiKey);

    axios
      .post(uploadUrl, form, {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      })
      .then(() => resolve())
      .catch((err) => reject(err));
  });
};

module.exports = { sendZip };
