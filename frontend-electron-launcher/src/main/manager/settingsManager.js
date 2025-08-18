/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const { Database } = require("../utils");

class SettingsManager {
  constructor() {
    this.db = new Database();
    this.settings = [
      "customGamePath",
      "launcherBehavior",
      "betaEnabled",
      "steamInstallation",
      "refreshTimeout",
      "isDev",
    ];
  }

  async getSetting(setting) {
    if (!this.settings.includes(setting)) {
      throw new Error(`Setting "${setting}" does not exist.`);
    }

    const config = await this.db.readData("configClient");
    return config ? config[setting] : undefined;
  }

  async setSetting(setting, value) {
    if (!this.settings.includes(setting)) {
      throw new Error(`Setting "${setting}" does not exist.`);
    }

    const config = (await this.db.readData("configClient")) || {};
    config[setting] = value;

    return await this.db.updateData("configClient", config);
  }
}

const settingsManager = new SettingsManager();
module.exports = settingsManager;
