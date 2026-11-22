/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { CSSProperties, ReactNode } from "react";

export interface SettingsBoxProps {
  /** Description du réglage (à gauche en mode `row`, au-dessus en mode `column`). */
  text?: string;
  children?: ReactNode;
  warn?: boolean;
  /** Appliqué comme `style` inline sur le conteneur. */
  sx?: CSSProperties;
  /**
   * `row` : texte à gauche, contrôle à droite (réglage simple) ; `column` : texte puis contenu pleine largeur
   * (tableaux, formulaires). Défaut : `row` s'il y a un texte, sinon `column`.
   */
  layout?: "row" | "column";
}
