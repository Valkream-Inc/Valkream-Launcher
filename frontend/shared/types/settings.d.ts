/**
 * @author Valkream Team
 * @license MIT-NC
 */

export type LauncherTheme = "old" | "modern" | "futuristic";
export type BackgroundType = "video" | "image" | "3d";
export type LauncherBehavior = "hide" | "close" | "nothing";

/** Réglages persistés dans la base locale (table `configClient`). */
export interface Settings {
  // general
  musicEnabled: boolean;
  betaEnabled: boolean;
  launcherTheme: LauncherTheme;
  backgroundType: BackgroundType;
  /** Langue de l'interface. */
  language: "fr" | "en";
  /** Clé API personnelle Nexus Mods (provider `nexus_modpack_url`). Locale : jamais envoyée au remote. */
  nexusApiKey: string;
}

export type SettingKey = keyof Settings;

/** Clés des réglages booléens (toggles). */
export type BooleanSettingKey = {
  [K in SettingKey]: Settings[K] extends boolean ? K : never;
}[SettingKey];
