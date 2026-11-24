/**
 * @author Valkream Team
 * @license MIT-NC
 */

import path from "path";

import type { SettingKey, Settings } from "@shared/types";

import { setErrorLanguage } from "../lib/errors/localized-error.js";
import type { Lang } from "../lib/errors/messages.js";
import { SettingsStore } from "../lib/settings/settings-store.js";
import DirsManager from "./dirs.js";

class SettingsManager {
  /** Langue en cache : les erreurs traduites (`LocalizedError`) la lisent de façon synchrone. */
  private language: Lang = "fr";
  readonly defaultSettings: Settings = {
    // general
    musicEnabled: true,
    betaEnabled: false,
    launcherTheme: "modern",
    backgroundType: "video",
    nexusApiKey: "",
    language: Intl.DateTimeFormat().resolvedOptions().locale.startsWith("fr") ? "fr" : "en",
  };
  private readonly store: SettingsStore<Settings>;
  private readonly ready: Promise<void>;

  constructor() {
    this.store = new SettingsStore<Settings>(path.join(DirsManager.dbPath(), "settings.json"), this.defaultSettings);
    this.ready = this.init();
  }

  async init(): Promise<void> {
    this.store.init();
    this.language = this.store.get("language") === "en" ? "en" : "fr";
    setErrorLanguage(() => this.language);
  }

  async getSetting<K extends SettingKey>(setting: K): Promise<Settings[K]> {
    await this.ready;
    if (this.defaultSettings[setting] === undefined) throw new Error(`Setting "${setting}" does not exist.`);
    return this.store.get(setting);
  }

  async setSetting<K extends SettingKey>(setting: K, value: Settings[K]): Promise<boolean> {
    await this.ready;
    if (this.defaultSettings[setting] === undefined) throw new Error(`Setting "${setting}" does not exist.`);
    this.store.set(setting, value);
    if (setting === "language") this.language = value === "en" ? "en" : "fr";
    return true;
  }
}

export default new SettingsManager();
