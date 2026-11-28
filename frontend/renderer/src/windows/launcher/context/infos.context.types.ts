/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ReactNode } from "react";
import type {
  GameEvent,
  InstanceStatus,
  Maintenance,
  ServerInfos,
} from "@shared/types";

export interface InfosProviderProps {
  children: ReactNode;
}

/** Progression du premier chargement des infos. */
export interface InfosLoadingState {
  infosLoaded: boolean;
  installationStatusLoaded: boolean;
}

/** Statut d'installation de l'instance active. */
export type InstallationStatut = InstanceStatus;

/**
 * Valeur exposée par `useInfos()`.
 * `null` = pas encore chargé, `false` = indisponible / absent.
 */
export interface InfosContextValue {
  isLoading: boolean;
  event: GameEvent | false | null;
  maintenance: Maintenance | false | null;
  serverInfos: ServerInfos | false | null;
  isInternetConnected: boolean | null;
  isServerReachable: boolean | null;
  installationStatut: InstallationStatut | null;
}
