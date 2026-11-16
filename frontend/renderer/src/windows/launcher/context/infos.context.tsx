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
import type {
  ElectronSevenDtoDAPI,
  ElectronValheimAPI,
  GameEvent,
  GameName,
  Maintenance,
  ServerInfos,
} from "@shared/types";

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
  const { actualGame } = useGames();
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

  const actualGameRef = useRef<GameName | null>(null); // Pour vérifier si le jeu a changé
  const actionLoadingRef = useRef<boolean | null>(null); // Pour vérifier si une nouvelle action est en cours
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null); // Pour lancer une fois à blanc avant de lancer la boucle
  const isLoadingRef = useRef(false); // Pour empêcher les appels parallèles

  useEffect(() => {
    if (
      !window.electron_Valheim_API?.getInstallationStatut ||
      !window.electron_API?.getInfos
    ) {
      console.warn(
        "L'API Electron n'est pas disponible. Vérification des infos impossible."
      );
      return;
    }

    if (actionLoadingRef.current !== actionLoading)
      actionLoadingRef.current = actionLoading;

    if (actualGameRef.current !== actualGame) {
      actualGameRef.current = actualGame;

      // Reset complet
      setEvent(null);
      setMaintenance(null);
      setServerInfos(null);
      setLoadingState({
        infosLoaded: false,
        installationStatusLoaded: actualGame !== "Valheim",
      });
    }

    const GAMES_APIS: Record<
      GameName,
      ElectronValheimAPI | ElectronSevenDtoDAPI
    > = {
      Valheim: window.electron_Valheim_API,
      SevenDtoD: window.electron_SevenDtoD_API,
    };

    const getAllInfos = async () => {
      // Empêcher les appels parallèles
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;

      try {
        // get installation statut
        if (!actionLoading && GAMES_APIS[actualGame]) {
          const statut = await GAMES_APIS[actualGame].getInstallationStatut();
          if (actualGameRef.current !== actualGame) {
            isLoadingRef.current = false;
            return; // Récupération des infos uniquement si le jeu n'a pas changé
          }
          if (actionLoadingRef.current) {
            isLoadingRef.current = false;
            return; // Récupération des infos uniquement si l'action n'a pas changé
          }
          setIsInternetConnected(statut?.isInternetConnected || false);
          setIsServerReachable(statut?.isServerReachable || false);
          setInstallationStatut(statut);
          setLoadingState((prev) => ({
            ...prev,
            installationStatusLoaded: true,
          }));
        }

        // get other infos
        const infos = await window.electron_API.getInfos(actualGame);
        if (actualGameRef.current !== actualGame) {
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
      } finally {
        isLoadingRef.current = false;
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
        intervalRef.current = setInterval(getAllInfos, 1000);
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [actionLoading, actualGame]);

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
