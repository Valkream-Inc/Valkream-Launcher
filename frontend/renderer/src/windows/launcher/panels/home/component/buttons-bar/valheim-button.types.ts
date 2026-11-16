/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ProgressData } from "@shared/types";

/** Texte et comportement du bouton principal (Valheim). */
export interface ValheimButtonAction {
  text: string;
  playIcon: boolean;
  onClick: () => void;
}

/** Progression partielle : seul `text` est toujours présent. */
export type ValheimButtonProgress = Pick<ProgressData, "text"> &
  Partial<ProgressData>;
