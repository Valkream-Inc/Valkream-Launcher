/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { SevenDtoDModFileDiff } from "@shared/types";
import type { Dispatch, SetStateAction } from "react";
import type { ModsThemeStyles } from "./ModsStyle.types";

export interface ModsSyncPaginationProps {
  processedMods: SevenDtoDModFileDiff[];
  themeStyles: ModsThemeStyles;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  rowsPerPage: number;
  setRowsPerPage: Dispatch<SetStateAction<number>>;
}
