/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { Dispatch, ReactNode, SetStateAction } from "react";

export interface ActionProviderProps {
  children: ReactNode;
}

/** Valeur exposée par `useAction()`. */
export interface ActionContextValue {
  /** Vrai tant qu'une action longue est en cours. */
  actionLoading: boolean;
  /** Identifiant de l'action en cours (`null` si aucune). */
  currentKey: string | null;
  /** Démarre une action ; retourne son id, ou `null` si une action est déjà en cours. */
  /** Tâche de fond (ex : DepotDownloader) : garde les panneaux montés sans bloquer les boutons. */
  /** Mode dev activé dans les réglages (affiche les outils techniques, ex : journal de DepotDownloader). */
  devActive: boolean;
  setDevActive: Dispatch<SetStateAction<boolean>>;
  keepAlive: boolean;
  /** Un composant demande (`true`) ou lâche (`false`) le maintien des panneaux montés ; plusieurs demandeurs possibles (clé = demandeur). */
  setKeepAlive: (owner: string, active: boolean) => void;
  startAction: (id?: string) => string | null;
  finishAction: () => void;
  /** Exécute `fn` en marquant l'action comme en cours (lève si une action est déjà active). */
  runAction: <T>(fn: () => T | Promise<T>, id?: string) => Promise<T>;
}
