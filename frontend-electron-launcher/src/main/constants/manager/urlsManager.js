/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { baseUrl } = require("..");

class UrlsManager {
  getMaintenanceUrl = () => `${baseUrl}/config/maintenance.json`;
  getEventUrl = () => `${baseUrl}/config/event.json`;
  getLatestGameVersionUrl = () => `${baseUrl}/game/latest/latest.yml`;
}

module.exports = UrlsManager;
