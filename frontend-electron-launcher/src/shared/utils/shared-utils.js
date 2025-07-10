const database = require("./database");
const { hasInternetConnection } = require("./internet");
const Logger = require("./logger");

// managers
const PathsManager = require("./pathsManager");

module.exports = {
  database,
  hasInternetConnection,
  Logger,
  PathsManager,
};
