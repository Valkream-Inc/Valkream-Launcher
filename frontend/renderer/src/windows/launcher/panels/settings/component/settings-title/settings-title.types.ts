/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ReactNode } from "react";

export interface SettingsTitleProps {
  children?: ReactNode;
  warn?: boolean;
  /**
   * Portée de la section, affichée en pastille pour que le joueur sache ce qu'il modifie :
   * `global` (tous les jeux), `game` (ce jeu et ce canal), `advanced` (dev / admin).
   */
  scope?: "global" | "game" | "advanced";
  /** Précision de la portée (ex : canal `beta`). */
  scopeDetail?: string;
}
