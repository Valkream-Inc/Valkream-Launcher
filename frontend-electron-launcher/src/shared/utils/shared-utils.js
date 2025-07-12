const database = require("./database");
const { hasInternetConnection } = require("./internet");
const Logger = require("./logger");
const pkg = require("../../../package.json");

// managers
const PathsManager = require("./pathsManager");

module.exports = {
  database,
  hasInternetConnection,
  Logger,
  PathsManager,
  pkg,
};
