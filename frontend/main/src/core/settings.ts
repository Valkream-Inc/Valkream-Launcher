/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { SettingKey, Settings } from "@shared/types";

import Database from "../lib/database.js";
import { setErrorLanguage } from "../lib/localized-error.js";
import type { Lang } from "../lib/messages.js";

class SettingsManager {
  /** Langue en cache : les erreurs traduites (`LocalizedError`) la lisent de façon synchrone. */
  private language: Lang = "fr";
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
      language: Intl.DateTimeFormat().resolvedOptions().locale.startsWith("fr") ? "fr" : "en",
    };
  }

  async init(): Promise<void> {
    const configData = await this.db.readData("configClient");
    if (!configData) {
      await this.db.createData("configClient", this.defaultSettings);
    }
    this.language = (await this.getSetting("language")) === "en" ? "en" : "fr";
    setErrorLanguage(() => this.language);
  }

  async getSetting<K extends SettingKey>(setting: K): Promise<Settings[K]> {
    if (this.defaultSettings[setting] === undefined)
      throw new Error(`Setting "${setting}" does not exist.`);

    const config = await this.db.readData<Settings>("configClient");
    // Réglage absent d'une config créée par une ancienne version : valeur par défaut
    return config?.[setting] ?? this.defaultSettings[setting];
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
    if (setting === "language") this.language = value === "en" ? "en" : "fr";
    return true;
  }
}

const settingsManager = new SettingsManager();
settingsManager.init();
export default settingsManager;
