const config = require("./config.js");

const { cleanGameFolder } = require("./function/cleanGameFolder");
const { consoleQuestion } = require("./function/consoleQuestion");
const { consoleStreamAnswer } = require("./function/consoleStreamAnswer");
const { downloadZip } = require("./function/dowloadZip");
const { formatBytes } = require("./function/formatBytes");
const { getAllFilesInAFolder } = require("./function/getAllFilesInAFolder");
const { hashFolder } = require("./function/hashFolder");
const { sendZip } = require("./function/sendZip");
const { zipFolder } = require("./function/zipFolder");
const { unZip } = require("./function/unZip");

module.exports = {
  cleanGameFolder,
  consoleQuestion,
  consoleStreamAnswer,
  downloadZip,
  formatBytes,
  getAllFilesInAFolder,
  hashFolder,
  sendZip,
  zipFolder,
  unZip,
  config,
};
