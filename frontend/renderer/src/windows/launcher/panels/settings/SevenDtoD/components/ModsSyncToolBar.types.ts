/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { SevenDtoDModFileDiff } from "@shared/types";
import type { ModsThemeStyles } from "./ModsStyle.types";

export interface ModsSyncToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  themeStyles: ModsThemeStyles;
  modsToDisplay: SevenDtoDModFileDiff[];
}
