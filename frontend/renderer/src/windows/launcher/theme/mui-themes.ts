/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Thèmes MUI du launcher (un par thème visuel : old / modern / futuristic).
 * Couleurs, polices et formes des composants MUI sont définies ici une seule fois :
 * les composants utilisent `theme.palette` / `sx` avec des tokens (`text.secondary`,
 * `grey.800`, `info.main`…) au lieu de valeurs en dur.
 */

import { createTheme, type Theme, type ThemeOptions } from "@mui/material/styles";
import type { LauncherTheme } from "@shared/types";

/** Couleurs sémantiques (mêmes valeurs que les popups de chaque thème). */
const semantic = (colors: {
  info: string;
  success: string;
  warning: string;
  error: string;
}): ThemeOptions["palette"] => ({
  info: { main: colors.info },
  success: { main: colors.success },
  warning: { main: colors.warning },
  error: { main: colors.error },
});

const base: ThemeOptions = {
  palette: { mode: "dark" },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
  },
};

const options: Record<LauncherTheme, ThemeOptions> = {
  modern: {
    ...base,
    palette: {
      mode: "dark",
      background: { default: "#121212", paper: "#1e1e1e" },
      text: { primary: "#ffffff", secondary: "#e0e0e0" },
      grey: { 700: "#555555", 800: "#444444" },
      ...semantic({ info: "#4da6ff", success: "#4dff88", warning: "#ffbb33", error: "#ff4d4d" }),
    },
    components: {
      ...base.components,
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { borderRadius: 10 } },
      },
    },
  },
  old: {
    ...base,
    palette: {
      mode: "dark",
      background: { default: "#2b1a0f", paper: "#fdf5e6" },
      ...semantic({ info: "#3399ff", success: "#4dff88", warning: "#ffaa33", error: "#ff0033" }),
    },
    typography: { fontFamily: "'MedievalSharp', 'Times New Roman', serif" },
  },
  futuristic: {
    ...base,
    palette: {
      mode: "dark",
      background: { default: "#0a0f1a", paper: "#101826" },
      ...semantic({ info: "#33aaff", success: "#4dff88", warning: "#ffbb33", error: "#ff4d4d" }),
    },
    typography: { fontFamily: "'Orbitron', sans-serif" },
  },
};

/** Les thèmes sont créés une fois, au chargement du module. */
export const muiThemes: Record<LauncherTheme, Theme> = {
  modern: createTheme(options.modern),
  old: createTheme(options.old),
  futuristic: createTheme(options.futuristic),
};
