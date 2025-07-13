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
const HashManager = require("./manager/hashManager.js");
const LauncherManager = require("./manager/launcherManager.js");

module.exports = {
  // utils
  changePanel,
  showSnackbar,
  Popup,
  // manager
  EventManager,
  HashManager,
  LauncherManager,
};
