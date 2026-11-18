/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ReactNode } from "react";
import type { GameName } from "@shared/types";

export interface GamesProviderProps {
  children: ReactNode;
}

/** Valeur exposée par `useGames()`. */
export interface GamesContextValue {
  actualGame: GameName;
  /** Change le jeu actif (lève si le jeu est inconnu). */
  changeActualGame: (newGame: GameName) => void;
  /** Instance (nouveau système) sélectionnée, ou `null` si un jeu historique est actif. */
  actualInstanceId: string | null;
  /** Sélectionne une instance du nouveau système. */
  changeActualInstance: (instanceId: string) => void;
}
