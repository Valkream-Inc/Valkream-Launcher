/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ReactNode } from "react";
import type { Channel, GamesRootMove, InstanceId } from "@shared/types";

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
  /** Change l'instance active et son canal (défaut : stable). Lève si elle n'a pas de config render. */
  changeActualInstance: (instanceId: InstanceId, channel?: Channel) => void;
  /** Canal de l'installation active (choisi dans la liste des jeux : une entrée par canal). */
  actualChannel: Channel;
  /** Vérifie que le canal actif est encore proposé (réglage désactivé, canal retiré du remote) : sinon stable. */
  refreshChannel: () => Promise<void>;
  /** Le canal actif n'est plus proposé (tests désactivés, jeu sans stable…) : retour au choix du jeu requis. */
  channelLost: boolean;
  clearChannelLost: () => void;
  /** Déplacement du dossier des jeux en cours : rien ne doit être lancé ni installé pendant ce temps. */
  gamesRootMove: GamesRootMove;
}
