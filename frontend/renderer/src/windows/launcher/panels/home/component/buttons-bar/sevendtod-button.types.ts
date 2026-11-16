/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { SvgIconComponent } from "@mui/icons-material";
import type {
  ElectronAPI,
  ElectronSevenDtoDAPI,
  ProgressData,
} from "@shared/types";

/** Texte et comportement du bouton principal (7 Days to Die). */
export interface SevenDtoDButtonAction {
  text: string;
  Icon: SvgIconComponent | null;
  onClick: () => void;
}

/** Progression partielle : seul `text` est toujours présent. */
export type SevenDtoDButtonProgress = Pick<ProgressData, "text"> &
  Partial<ProgressData>;

/**
 * Sélection du chemin du jeu : réglage et méthode absents des types partagés
 * (`Settings` / `ElectronSevenDtoDAPI`), typés localement.
 */
export interface GamePathElectronAPI {
  getSettings(key: "gamePathWithSevenDtoD"): Promise<string | undefined>;
  setSettings(key: "gamePathWithSevenDtoD", value: string): Promise<boolean>;
  chooseFolder: ElectronAPI["chooseFolder"];
}

export interface GamePathSevenDtoDAPI {
  testIsSteamGamePathValid(path: string): Promise<boolean>;
}

export type GamePathSevenDtoDElectronAPI = ElectronSevenDtoDAPI &
  GamePathSevenDtoDAPI;
