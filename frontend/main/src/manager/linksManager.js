/**
 * @author Valkream Team
 * @license MIT-NC
 */

const { baseUrl } = require("../constants");

class LinksManager {
  maintenanceUrl = (game) => `${baseUrl}/config/${game}/maintenance.json`;

  eventUrl = (game) => `${baseUrl}/config/${game}/event.json`;
}

module.exports = new LinksManager();
