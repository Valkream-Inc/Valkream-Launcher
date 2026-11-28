/**
 * @author Valkream Team
 * @license MIT-NC
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { GameEvent, Maintenance, ServerInfos } from "@shared/types";

import Loader from "../component/loader/loader";
import { useAction } from "./action.context";
import { useGames } from "./games.context";
import { usePanels } from "./panels.context";
import type {
  InfosContextValue,
  InfosLoadingState,
  InfosProviderProps,
  InstallationStatut,
} from "./infos.context.types";

// Statut (disque + remote) et infos serveur : inutile de les relire chaque seconde.
// Un changement d'action (installation terminée…) relance une lecture immédiate (voir l'effet).
const REFRESH_INTERVAL_MS = 5000;

const InfosContext = createContext<InfosContextValue | undefined>(undefined);
export const useInfos = (): InfosContextValue => {
  const ctx = useContext(InfosContext);
  if (!ctx) throw new Error("useInfos doit être utilisé dans un InfosProvider");
  return ctx;
};

export const InfosProvider = ({ children }: InfosProviderProps) => {
  const [loadingState, setLoadingState] = useState<InfosLoadingState>({
    infosLoaded: false,
    installationStatusLoaded: false,
  });
  const { actionLoading } = useAction();
  const { actualInstanceId, actualChannel, refreshTick } = useGames();
  const { activePanel } = usePanels();

  const [event, setEvent] = useState<GameEvent | false | null>(null);
  const [maintenance, setMaintenance] = useState<Maintenance | false | null>(
    null
  );
  const [serverInfos, setServerInfos] = useState<ServerInfos | false | null>(
    null
  );
  const [isInternetConnected, setIsInternetConnected] = useState<
    boolean | null
  >(null);
  const [isServerReachable, setIsServerReachable] = useState<boolean | null>(
    null
  );
  const [installationStatut, setInstallationStatut] =
    useState<InstallationStatut | null>(null);

  const isLoading = !(
    loadingState.infosLoaded && loadingState.installationStatusLoaded
  );

  // Pour vérifier si le jeu (ou son canal) a changé
  const actualGameRef = useRef<string | null>(null);
  const statusKeyRef = useRef<string | null>(null); // Jeu dont le statut est déjà connu (lecture seule : possible même pendant une action)
  const actionLoadingRef = useRef<boolean | null>(null); // Pour vérifier si une nouvelle action est en cours
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null); // Pour lancer une fois à blanc avant de lancer la boucle
  const isLoadingRef = useRef(false); // Pour empêcher les appels parallèles
  const rerunRef = useRef(false); // Une demande arrivée pendant un appel en cours : relancée juste après (pas dans 5 s)

  useEffect(() => {
    if (
      !window.electron_API?.getInstanceStatus ||
      !window.electron_API?.getInstanceInfos
    ) {
      console.warn(
        "L'API Electron n'est pas disponible. Vérification des infos impossible."
      );
      return;
    }

    if (actionLoadingRef.current !== actionLoading)
      actionLoadingRef.current = actionLoading;

    const gameKey = `${actualInstanceId}@${actualChannel}`;
    if (actualGameRef.current !== gameKey) {
      actualGameRef.current = gameKey;

      // Reset complet
      setEvent(null);
      setMaintenance(null);
      setServerInfos(null);
      setLoadingState({
        infosLoaded: false,
        installationStatusLoaded: false,
      });
      setInstallationStatut(null);
      statusKeyRef.current = null;
    }

    const getAllInfos = async () => {
      // Pas d'appels parallèles ; la demande est mémorisée et rejouée dès que l'appel en cours se termine.
      // Sinon, juste après une action (désinstallation…), la mise à jour attendait le prochain tour (5 s).
      if (isLoadingRef.current) {
        rerunRef.current = true;
        return;
      }
      isLoadingRef.current = true;

      try {
        // get installation statut
        // Pendant une action, le statut n'est relu que pour un jeu qu'on n'a pas encore vu (changement de jeu)
        const statusAllowed = !actionLoading || statusKeyRef.current !== gameKey;
        if (statusAllowed) {
          const statut = await window.electron_API.getInstanceStatus(
            actualInstanceId,
            actualChannel
          );
          if (actualGameRef.current !== gameKey) {
            isLoadingRef.current = false;
            return; // Récupération des infos uniquement si le jeu n'a pas changé
          }
          if (actionLoadingRef.current && statusKeyRef.current === gameKey) {
            isLoadingRef.current = false;
            return; // Récupération des infos uniquement si l'action n'a pas changé
          }
          statusKeyRef.current = gameKey;
          setIsInternetConnected(statut?.isInternetConnected || false);
          setIsServerReachable(statut?.isServerReachable || false);
          setInstallationStatut(statut);
          setLoadingState((prev) => ({
            ...prev,
            installationStatusLoaded: true,
          }));
        }

        // Pendant une action, les autres infos (serveur, événement) attendent : la relecture qui suit la fin
        // de l'action ne doit pas être retardée par une requête serveur lente.
        if (actionLoadingRef.current) return;

        // get other infos
        const infos = await window.electron_API.getInstanceInfos(
          actualInstanceId,
          actualChannel
        );
        if (actualGameRef.current !== gameKey) {
          isLoadingRef.current = false;
          return; // Récupération des infos uniquement si le jeu n'a pas changé
        }
        setServerInfos(infos?.serverInfos || false);
        setEvent(infos?.event || false);
        if (!actionLoading && !actionLoadingRef.current)
          setMaintenance(infos?.maintenance || false);
        setLoadingState((prev) => ({ ...prev, infosLoaded: true }));
      } catch (error) {
        console.error("Erreur lors de la récupération des infos :", error);
        // Hors ligne / serveur injoignable : on affiche quand même l'accueil (la prochaine lecture réessaie)
        if (actualGameRef.current === gameKey)
          setLoadingState({ infosLoaded: true, installationStatusLoaded: true });
      } finally {
        isLoadingRef.current = false;
        if (rerunRef.current) {
          rerunRef.current = false;
          void getAllInfos();
        }
      }
    };

    // Nettoyer l'interval précédent s'il existe
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Appeler la première fois et attendre la réponse avant de lancer l'intervalle
    getAllInfos().then(() => {
      // Vérifier que le composant n'a pas été démonté ou que les dépendances n'ont pas changé
      if (intervalRef.current === null) {
        intervalRef.current = setInterval(getAllInfos, REFRESH_INTERVAL_MS);
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [actionLoading, actualInstanceId, actualChannel, refreshTick]);

  const contextValue: InfosContextValue = {
    isLoading,
    event,
    maintenance,
    serverInfos,
    isInternetConnected,
    isServerReachable,
    installationStatut,
  };

  return (
    <InfosContext.Provider value={contextValue}>
      <Loader
        isVisible={
          isLoading && (activePanel === "home" || activePanel === "settings")
        }
      />
      {children}
    </InfosContext.Provider>
  );
};
