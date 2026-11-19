/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { SettingKey, Settings } from "@shared/types";

import Database from "../lib/database";

class SettingsManager {
  db: Database;
  defaultSettings: Settings;

  constructor() {
    this.db = new Database();
    this.defaultSettings = {
      // general
      musicEnabled: true,
      betaEnabled: false,
      launcherTheme: "modern",
      backgroundType: "video",
    };
  }

  async init(): Promise<void> {
    const configData = await this.db.readData("configClient");
    if (!configData) {
      await this.db.createData("configClient", this.defaultSettings);
    }
  }

  async getSetting<K extends SettingKey>(setting: K): Promise<Settings[K]> {
    if (this.defaultSettings[setting] === undefined)
      throw new Error(`Setting "${setting}" does not exist.`);

    const config = await this.db.readData<Settings>("configClient");
    return config ? config[setting] : this.defaultSettings[setting];
  }

  async setSetting<K extends SettingKey>(
    setting: K,
    value: Settings[K]
  ): Promise<boolean> {
    if (this.defaultSettings[setting] === undefined)
      throw new Error(`Setting "${setting}" does not exist.`);

    const config: Partial<Settings> =
      (await this.db.readData<Settings>("configClient")) || {};
    config[setting] = value;

    await this.db.updateData("configClient", config);
    return true;
  }
}

const settingsManager = new SettingsManager();
settingsManager.init();
export default settingsManager;
