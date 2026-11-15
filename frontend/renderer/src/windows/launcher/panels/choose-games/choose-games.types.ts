/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ReactNode } from "react";
import type { GameName } from "@shared/types";

/** Jeu affiché dans la grille de sélection. */
export interface GameEntry {
  id: GameName;
  /** Nom affiché (alt) et utilisé pour la recherche. */
  name: string;
  /** Chemin d'image ou élément React personnalisé. */
  icon: string | ReactNode;
}

/** Résultat d'une correspondance floue (`null` si pas de match). */
export interface FuzzyMatchResult {
  distance: number;
  position: number;
}

/** Couleurs de la barre de recherche selon le thème. */
export interface SearchColors {
  text: string;
  border: string;
  focus: string;
  bg: string;
}

export interface GameCardProps {
  children?: ReactNode;
}
