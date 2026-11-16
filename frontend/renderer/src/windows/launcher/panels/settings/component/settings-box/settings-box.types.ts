/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { CSSProperties, ReactNode } from "react";

export interface SettingsBoxProps {
  text?: string;
  children?: ReactNode;
  warn?: boolean;
  /** Appliqué comme `style` inline sur le conteneur. */
  sx?: CSSProperties;
}
