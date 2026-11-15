/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ReactNode, RefObject } from "react";
import type { BackgroundType } from "@shared/types";

export interface BackgroundProviderProps {
  children: ReactNode;
}

/** Valeur exposée par `useBackground()`. */
export interface BackgroundContextValue {
  /** Référence vers la balise <video> / <audio> du fond. */
  VideoBackgroundRef: RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  isMuted: boolean;
  play: () => void;
  pause: () => void;
  mute: () => void;
  unmute: () => void;
  /** Sauvegarde le réglage puis met à jour l'état (lève si la valeur est invalide). */
  changeBackgroundType: (value: BackgroundType) => Promise<void>;
  backgroundType: BackgroundType;
}
