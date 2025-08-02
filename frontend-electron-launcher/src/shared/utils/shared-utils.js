/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const database = require("./database");
const { hasInternetConnection, isServerReachable } = require("./internet");
const logger = require("./logger");
const pkg = require("../../../package.json");

// managers
const PathsManager = require("./pathsManager");

module.exports = {
  database,
  hasInternetConnection,
  isServerReachable,
  logger,
  PathsManager,
  pkg,
};
