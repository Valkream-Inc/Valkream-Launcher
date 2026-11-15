/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { baseUrl } = require("../constants");

class LinksManager {
  maintenanceUrl = (game) => `${baseUrl}/configs/${game}/maintenance.json`;
  eventUrl = (game) => `${baseUrl}/configs/${game}/event.json`;
}

module.exports = new LinksManager();
