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
  // Valheim
  launchSteamWithValheim: boolean;
  launcherBehaviorWithValheim: LauncherBehavior;
  boostfpsModsEnabledWithValheim: boolean;
  boostgraphicModsEnabledWithValheim: boolean;
  adminModsEnabledWithValheim: boolean;
  // SevenDtoD
  launchSteamWithSevenDtoD: boolean;
  launcherBehaviorWithSevenDtoD: LauncherBehavior;
}

export type SettingKey = keyof Settings;
