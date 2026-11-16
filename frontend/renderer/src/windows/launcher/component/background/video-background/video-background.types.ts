/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { CSSProperties } from "react";

export interface VideoBackgroundProps {
  style?: CSSProperties;
}

/** Balise utilisée selon le type de fond (vidéo ou audio seul). */
export type VideoBackgroundTag = "video" | "audio";
