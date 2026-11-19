/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { Dispatch, SetStateAction } from "react";

/** Props du panneau de paramètres d'une instance. */
export interface GameSettingsProps {
  returnToHome: () => void;
  changeTab: (tab: string) => void;
  activeTab: string;
  ToggleIsConfirmSpecialOptionVisible: () => void;
  isSpecialOptionVisible: boolean;
  setIsDevActive: Dispatch<SetStateAction<boolean>>;
  isDevActive: boolean;
}
