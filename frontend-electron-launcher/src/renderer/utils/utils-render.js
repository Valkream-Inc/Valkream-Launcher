/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

// utils
const { showSnackbar } = require("./snackbar.js");
const { changePanel } = require("./changePanel.js");

const Popup = require("./popup.js");
const isFolderOk = require("./isFolderOk.js");
// manager
const Manager = require("./manager/manager.js");
const EventManager = require("./manager/eventManager.js");
const MaintenanceManager = require("./manager/maintenanceManager.js");
const LauncherManager = require("./manager/launcherManager.js");
const VersionManager = require("./manager/versionManager.js");
const GameManager = require("./manager/gameManager.js");
const ThunderstoreManager = require("./manager/thunderstoreManager.js");
const SteamManager = require("./manager/steamManager.js");

module.exports = {
  // utils
  changePanel,
  showSnackbar,
  Popup,
  isFolderOk,
  // manager
  Manager,
  EventManager,
  MaintenanceManager,
  LauncherManager,
  VersionManager,
  GameManager,
  SteamManager,
  ThunderstoreManager,
};
