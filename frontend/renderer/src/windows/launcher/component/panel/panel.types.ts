/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ReactNode } from "react";
import type { PanelId } from "../../../../types/panels.types";

export interface PanelProps {
  id: PanelId;
  children: ReactNode;
}
