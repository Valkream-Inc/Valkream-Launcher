/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ReactNode } from "react";

export interface SettingsTabProps {
  id: string;
  activeTab: string;
  children?: ReactNode;
}
