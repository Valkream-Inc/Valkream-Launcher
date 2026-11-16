/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { LauncherTheme, SevenDtoDModFileDiff } from "@shared/types";
import type { ModsThemeStyles } from "./ModsStyle.types";

export interface ModsSyncTableProps {
  modsToDisplay?: SevenDtoDModFileDiff[];
  theme: LauncherTheme;
  themeStyles: ModsThemeStyles;
}

export type SortKey =
  | "status"
  | "oldPath"
  | "newPath"
  | "hashLocal"
  | "hashOnline";

export type SortDirection = "asc" | "desc";

export interface HeadCell {
  id: SortKey;
  label: string;
  width?: string;
}
