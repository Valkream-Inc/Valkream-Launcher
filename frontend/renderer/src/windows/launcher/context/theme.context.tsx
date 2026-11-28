/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { createContext, useState, useContext, useEffect, useMemo } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import type { LauncherTheme } from "@shared/types";

import { muiThemes } from "../theme/mui-themes";

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
    if (!(value in muiThemes)) throw new Error("Invalid theme value");

    await window.electron_API.setSettings("launcherTheme", value);
    setTheme(value);
  };

  // Thème enregistré : appliqué sans le réécrire.
  useEffect(() => {
    window.electron_API
      .getSettings("launcherTheme")
      .then((saved) => saved && saved in muiThemes && setTheme(saved));
  }, []);

  const value = useMemo(() => ({ theme, changeTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={muiThemes[theme]}>
        <span className={`${theme}-theme`}>{children}</span>
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
