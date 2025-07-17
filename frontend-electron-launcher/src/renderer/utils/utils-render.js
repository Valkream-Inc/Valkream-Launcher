/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

// utils
const { showSnackbar } = require("./snackbar.js");
const { changePanel } = require("./changePanel.js");

const Popup = require("./popup.js");

// manager
const EventManager = require("./manager/eventManager.js");
const LauncherManager = require("./manager/launcherManager.js");
const GameManager = require("./manager/gameManager.js");
const SteamManager = require("./manager/steamManager.js");
const ThunderstoreManager = require("./manager/thunderstoreManager.js");

module.exports = {
  // utils
  changePanel,
  showSnackbar,
  Popup,
  // manager
  EventManager,
  LauncherManager,
  GameManager,
  SteamManager,
  ThunderstoreManager,
};
