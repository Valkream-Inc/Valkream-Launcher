/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ReactNode } from "react";
import type { PanelId } from "../../../types/panels.types";

export interface PanelsProviderProps {
  children: ReactNode;
}

/** Valeur exposée par `usePanels()`. */
export interface PanelsContextValue {
  activePanel: PanelId;
  changePanel: (PanelsId: PanelId) => void;
}
