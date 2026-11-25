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

const THEMES = ["old", "modern", "futuristic"];
const BACKGROUNDS = ["video", "image", "3d"];

/** Valeur plausible pour ce réglage (type, liste de choix, bornes). */
export const isValidSetting = (key: SettingKey, value: unknown): boolean => {
  switch (key) {
    case "launcherTheme":
      return typeof value === "string" && THEMES.includes(value);
    case "backgroundType":
      return typeof value === "string" && BACKGROUNDS.includes(value);
    case "language":
      return value === "fr" || value === "en";
    case "nexusApiKey":
      return typeof value === "string";
    case "settingsZoom":
      return typeof value === "number" && Number.isFinite(value) && value >= 0.5 && value <= 3;
    case "musicEnabled":
    case "betaEnabled":
      return typeof value === "boolean";
    default:
      return false;
  }
};

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
    settingsZoom: 1,
    language: Intl.DateTimeFormat().resolvedOptions().locale.startsWith("fr") ? "fr" : "en",
  };
  private readonly store: SettingsStore<Settings>;
  private readonly ready: Promise<void>;

  constructor() {
    this.store = new SettingsStore<Settings>(
      path.join(DirsManager.dbPath(), "settings.json"),
      this.defaultSettings,
      (key, value) => isValidSetting(key, value),
    );
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
