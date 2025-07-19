const database = require("./database");
const { hasInternetConnection, isServerReachable } = require("./internet");
const Logger = require("./logger");
const pkg = require("../../../package.json");

// managers
const PathsManager = require("./pathsManager");

module.exports = {
  database,
  hasInternetConnection,
  isServerReachable,
  Logger,
  PathsManager,
  pkg,
};
