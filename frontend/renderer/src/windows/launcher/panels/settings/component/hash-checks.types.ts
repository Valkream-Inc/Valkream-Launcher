/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ValheimHashData } from "@shared/types";

export interface HashChecksProps {
  hashData: ValheimHashData;
}

export interface HashCheckRow {
  label: string;
  local: string;
  online: string | undefined;
  isSame: boolean;
}
