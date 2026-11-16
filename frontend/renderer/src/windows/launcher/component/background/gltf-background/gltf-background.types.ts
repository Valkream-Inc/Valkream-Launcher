/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ReactNode } from "react";

/** Réglages de la scène 3D selon le jeu. */
export interface GltfGameData {
  camera: { position: [number, number, number]; fov: number };
  lights: { ambientIntensity: number; color: string };
  /** Arguments de `<fog>` : [couleur, near, far]. */
  fogArgs: [string, number, number];
  environment: ReactNode;
  hasCampfire: boolean;
}
