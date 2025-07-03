const archiver = require("archiver");
const fs = require("fs");

const { consoleStreamAnswer } = require("./consoleStreamAnswer");
const { formatBytes } = require("./formatBytes");

const zipFolder = async (
  sourceFolderPath,
  zipOutputPath,
  callback = (processedBytes) =>
    consoleStreamAnswer(
      `🗜️  Compression ${path.basename(zipOutputPath)} : ${formatBytes(
        processedBytes
      )}`
    )
) => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipOutputPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      resolve(archive.pointer());
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.on("progress", (data) => {
      const {
        fs: { processedBytes },
      } = data;

      callback(processedBytes);
    });

    archive.pipe(output);
    archive.directory(sourceFolderPath, false);
    archive.finalize();
  });
};

module.exports = { zipFolder };
