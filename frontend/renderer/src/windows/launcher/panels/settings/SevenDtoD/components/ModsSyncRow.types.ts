/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { SvgIconComponent } from "@mui/icons-material";
import type { LauncherTheme, SevenDtoDModFileDiff } from "@shared/types";
import type { ModsThemeStyles } from "./ModsStyle.types";

export interface ModsSyncRowProps {
  mod: SevenDtoDModFileDiff;
  theme: LauncherTheme;
  themeStyles: ModsThemeStyles;
}

/** Icône, couleurs et libellé associés à un statut de synchronisation. */
export interface SyncStatusInfo {
  Icon: SvgIconComponent;
  icon: string;
  primaryText: string;
  bg: string;
  label: string;
}

export interface HashTextStyle {
  color: string;
  fontWeight: "bold" | "normal";
  fontFamily: string;
  fontSize: string;
}
