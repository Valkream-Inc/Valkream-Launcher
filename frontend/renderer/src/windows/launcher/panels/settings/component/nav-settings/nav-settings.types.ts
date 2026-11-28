/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ReactNode } from "react";

export interface NavButtonProps {
  id: string;
  label: string;
  active?: boolean;
  onClick?: (id: string) => void;
}

export interface NavSettingsProps {
  /** Appelé à la sauvegarde (retourne éventuellement une valeur truthy). */
  onSave: () => unknown;
  children?: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  ToggleIsConfirmAdminVisible: () => void;
  ToolBar?: ReactNode;
}
