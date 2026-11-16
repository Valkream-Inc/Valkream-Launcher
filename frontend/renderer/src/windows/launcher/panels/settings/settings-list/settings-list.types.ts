/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { SelectChangeEvent } from "@mui/material/Select";
import type { BackgroundType, LauncherBehavior, LauncherTheme } from "@shared/types";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";

/** Évènement d'un `Switch` (réglage booléen). */
export type ToggleChangeEvent = ChangeEvent<HTMLInputElement>;

/** Évènements des `Select` de réglages. */
export type LauncherBehaviorChangeEvent = SelectChangeEvent<LauncherBehavior>;
export type LauncherThemeChangeEvent = SelectChangeEvent<LauncherTheme>;
export type BackgroundTypeChangeEvent = SelectChangeEvent<BackgroundType>;

/** Props du réglage « outils de développement ». */
export interface ToggleDevProps {
  devActive?: boolean;
  setDevActive?: Dispatch<SetStateAction<boolean>> | ((enabled: boolean) => void);
  setTab?: (tab: string) => void;
}
