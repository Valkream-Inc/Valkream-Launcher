import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Loader from "../component/loader/loader";
import { useAction } from "./action.context.jsx";
import { useGames } from "./games.context.jsx";
import { usePanels } from "./panels.context.jsx";

const InfosContext = createContext(undefined);
export const useInfos = () => useContext(InfosContext);

export const InfosProvider = ({ children }) => {
  const [loadingState, setLoadingState] = useState({
    infosLoaded: false,
    installationStatusLoaded: false,
  });
  const { actionLoading } = useAction();
  const { actualGame } = useGames();
  const { activePanel } = usePanels();

  const [event, setEvent] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [serverInfos, setServerInfos] = useState(null);
  const [isInternetConnected, setIsInternetConnected] = useState(null);
  const [isServerReachable, setIsServerReachable] = useState(null);
  const [installationStatut, setInstallationStatut] = useState(null);

  const isLoading = !(
    loadingState.infosLoaded && loadingState.installationStatusLoaded
  );

  const actualGameRef = useRef("");
  useEffect(() => {
    if (
      !window.electron_API?.getInstallationStatut ||
      !window.electron_API?.getInfos
    ) {
      console.warn(
        "L'API Electron n'est pas disponible. Vérification des infos impossible."
      );
      return null;
    }

    if (actualGameRef.current !== actualGame) {
      actualGameRef.current = actualGame;

      // Reset complet
      setEvent(null);
      setMaintenance(null);
      setServerInfos(null);
      setLoadingState({
        infosLoaded: false,
        installationStatusLoaded: true,
      });
    }

    const getAllInfos = async () => {
      const researchGame = actualGame;

      try {
        // get installation statut
        if (!actionLoading && actualGameRef.current === "Valheim") {
          const statut = await window.electron_API.getInstallationStatut();
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
        if (actualGameRef.current !== researchGame) return; // Récupération des infos uniquement si le jeu n'a pas changé
        setServerInfos(infos?.serverInfos || false);
        setEvent(infos?.event || false);
        if (!actionLoading) setMaintenance(infos?.maintenance || false);
        setLoadingState((prev) => ({ ...prev, infosLoaded: true }));
      } catch (error) {
        console.error("Erreur lors de la récupération des infos :", error);
      }
    };

    const interval = setInterval(getAllInfos, 1000);
    getAllInfos();

    return () => clearInterval(interval);
  }, [actionLoading, actualGame]);

  const contextValue = {
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
