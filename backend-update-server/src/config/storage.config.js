const multer = require("multer");
const path = require("path");
const fs = require("fs");

const paths = require("./paths.config.js");

const tempUploadDir = paths.tempDir;
if (!fs.existsSync(tempUploadDir)) fs.mkdirSync(tempUploadDir);

const temp_storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempUploadDir),
  filename: (req, file, cb) => cb(null, file.originalname),
});

const temp = multer({
  storage: temp_storage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // Set file size limit (e.g., 2 GB)
    fieldSize: 2 * 1024 * 1024 * 1024, // Set field size limit (e.g., 2 GB)
    files: 1, // Optional: limit the number of file fields
  },
});

module.exports = {
  temp_storage,
  temp,
};
