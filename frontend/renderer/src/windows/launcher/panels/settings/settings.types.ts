/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { Dispatch, RefObject, SetStateAction } from "react";

/** Méthodes exposées (via `useImperativeHandle`) par les onglets de mods. */
export interface ModsTabHandle {
  reload: () => void | Promise<void>;
  /** Uniquement pour Valheim. */
  stop?: () => void;
  /** Uniquement pour Valheim. */
  freeze?: () => void;
}

/** Props communes aux panneaux de paramètres de chaque jeu. */
export interface GameSettingsProps {
  returnToHome: () => void;
  modsTabRef: RefObject<ModsTabHandle | null>;
  changeTab: (tab: string) => void;
  activeTab: string;
  ToggleIsConfirmSpecialOptionVisible: () => void;
  isSpecialOptionVisible: boolean;
  setIsDevActive: Dispatch<SetStateAction<boolean>>;
  isDevActive: boolean;
}
