/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ReactNode } from "react";
import type { LauncherTheme } from "@shared/types";

export interface ThemeProviderProps {
  children: ReactNode;
}

/** Valeur exposée par `useTheme()`. */
export interface ThemeContextValue {
  theme: LauncherTheme;
  /** Sauvegarde le réglage puis met à jour l'état (lève si le thème est invalide). */
  changeTheme: (value: LauncherTheme) => Promise<void>;
}
