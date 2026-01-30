/**
 * @author Valkream Team
 * @license MIT-NC
 */

const Database = require("../utils/database.js");

class SettingsManager {
  constructor() {
    this.db = new Database();
    this.defaultSettings = {
      // general
      musicEnabled: true,
      betaEnabled: false,
      launcherTheme: "modern",
      backgroundType: "video",
      // Valheim
      launchSteamWithValheim: true,
      launcherBehaviorWithValheim: "close",
      boostfpsModsEnabledWithValheim: false,
      boostgraphicModsEnabledWithValheim: false,
      adminModsEnabledWithValheim: false,
      // SevenDtoD
      launchSteamWithSevenDtoD: true,
      launcherBehaviorWithSevenDtoD: "close",
    };
  }

  async init() {
    let configData = await this.db.readData("configClient");
    if (!configData) {
      await this.db.createData("configClient", this.defaultSettings);
    }
  }

  async getSetting(setting) {
    if (this.defaultSettings[setting] === undefined)
      throw new Error(`Setting "${setting}" does not exist.`);

    const config = await this.db.readData("configClient");
    return config ? config[setting] : undefined;
  }

  async setSetting(setting, value) {
    if (this.defaultSettings[setting] === undefined)
      throw new Error(`Setting "${setting}" does not exist.`);

    const config = (await this.db.readData("configClient")) || {};
    config[setting] = value;

    await this.db.updateData("configClient", config);
    return true;
  }
}

const settingsManager = new SettingsManager();
settingsManager.init();
module.exports = settingsManager;
