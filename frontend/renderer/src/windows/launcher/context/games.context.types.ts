/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ReactNode } from "react";
import type { Channel, InstanceId } from "@shared/types";

import type { InstanceRenderConfig } from "../../../instances/instances.types";

export interface GamesProviderProps {
  children: ReactNode;
}

/** Valeur exposée par `useGames()`. */
export interface GamesContextValue {
  /** Instance (jeu) active. */
  actualInstanceId: InstanceId;
  /** Config render de l'instance active (images, fonds, 3D, textes, réglages…). */
  actualInstance: InstanceRenderConfig;
  /** Change l'instance active (lève si elle n'a pas de config render). */
  changeActualInstance: (instanceId: InstanceId) => void;
  /** Canal de l'installation active : beta seulement si activée ET proposée par le remote. */
  actualChannel: Channel;
  /** Recalcule le canal (après un changement du réglage beta). */
  refreshChannel: () => Promise<void>;
}
