/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { createContext, useState, useContext, useEffect } from "react";
import type { LauncherTheme } from "@shared/types";

import type {
  ThemeContextValue,
  ThemeProviderProps,
} from "./theme.context.types";

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
);
export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme doit être utilisé dans un ThemeProvider");
  return ctx;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<LauncherTheme>("modern");

  const changeTheme = async (value: LauncherTheme) => {
    const themes: LauncherTheme[] = ["old", "modern", "futuristic"];
    if (!themes.includes(value)) throw new Error("Invalid theme value");

    await window.electron_API.setSettings("launcherTheme", value);
    return setTheme(value);
  };

  useEffect(() => {
    const loadSettings = async () => {
      const launcherTheme = await window.electron_API.getSettings(
        "launcherTheme"
      );
      if (launcherTheme && launcherTheme !== theme) changeTheme(launcherTheme);
    };

    loadSettings();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      <span className={`${theme}-theme`}>{children}</span>
    </ThemeContext.Provider>
  );
};
