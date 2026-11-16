/**
 * @author Valkream Team
 * @license MIT-NC
 */

/** Type d'alerte affichée par le panel spécial. */
export type SpecialPanelType = "error" | "warning" | "info";

export interface SpecialPanelButton {
  text: string;
  onClick: () => void;
}

/** Props du panel spécial (titre et paragraphe par défaut selon le type). */
export interface SpecialPanelProps {
  type?: SpecialPanelType;
  buttons?: SpecialPanelButton[];
  title?: string;
  paragraph?: string;
}

/** Props des variantes par thème (titre et paragraphe déjà résolus). */
export interface SpecialPanelThemeProps {
  type?: SpecialPanelType;
  buttons?: SpecialPanelButton[];
  title: string;
  paragraph: string;
}
