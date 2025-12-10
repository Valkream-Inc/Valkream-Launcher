/**
 * @author Valkream Team
 * @license MIT-NC
 */

const pLimit = require("./p-limit");
const throttle = require("./throttle");
const newDir = require("./new-dir");
const isFolderPathSecured = require("./is-folder-path-secured");
const toValidUrl = require("./to-valid-url");
const { hasInternetConnection, isServerReachable } = require("./internet");

const Database = require("./database");

const dowloadMultiplefiles = require("./download-multiple-files");
const unZipMultipleFiles = require("./unzip-multiple-zips");

module.exports = {
  pLimit,
  throttle,
  newDir,
  isFolderPathSecured,
  toValidUrl,
  hasInternetConnection,
  isServerReachable,

  Database,

  dowloadMultiplefiles,
  unZipMultipleFiles,
};
