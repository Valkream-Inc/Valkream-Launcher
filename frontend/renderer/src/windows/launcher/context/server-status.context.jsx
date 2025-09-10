import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import Loader from "../component/loader/loader";

const ServerStatusContext = createContext(undefined);
export const useServerStatus = () => useContext(ServerStatusContext);

export const ServerStatusProvider = ({ children }) => {
  const [loadingState, setLoadingState] = useState({
    infosLoaded: false,
    statusLoaded: false,
  });

  const [event, setEvent] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [serverInfos, setServerInfos] = useState(null);
  const [isInternetConnected, setIsInternetConnected] = useState(false);
  const [isServerReachable, setIsServerReachable] = useState(false);

  const isLoading = !(loadingState.infosLoaded && loadingState.statusLoaded);

  const getInstallationStatut = useCallback(async () => {
    if (!window.electron_API || !window.electron_API.getInstallationStatut)
      return console.warn(
        "L'API Electron n'est pas disponible. Vérification des infos impossible."
      );

    try {
      const statut = await window.electron_API.getInstallationStatut();
      setIsInternetConnected(statut?.isInternetConnected || false);
      setIsServerReachable(statut?.isServerReachable || false);
      setLoadingState((prevState) => ({ ...prevState, statusLoaded: true }));

      return statut;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du statut d'installation :",
        error
      );
      setIsInternetConnected(false);
      setIsServerReachable(false);
      setLoadingState((prevState) => ({ ...prevState, statusLoaded: true }));

      return null;
    }
  }, []);

  useEffect(() => {
    if (
      window.electron_API &&
      window.electron_API.onUpdateInfos &&
      window.electron_API.checkInfos
    ) {
      // Utilisation de useCallback pour s'assurer que handleUpdate est stable
      const handleUpdate = (infos) => {
        setEvent(infos.event || null);
        setMaintenance(infos.maintenance || null);
        setServerInfos(infos.serverInfos || null);
        setLoadingState((prevState) => ({ ...prevState, infosLoaded: true }));
      };

      // ✅ Ajout unique du listener
      window.electron_API.onUpdateInfos(handleUpdate);

      // Check initial
      window.electron_API.checkInfos();
      getInstallationStatut();

      // Cleanup pour éviter les fuites
      return () => {
        window.electron_API.removeUpdateInfos(handleUpdate);
      };
    } else {
      console.warn(
        "L'API Electron n'est pas disponible. Vérification des infos impossible."
      );
      setLoadingState({ infosLoaded: true });
    }
  }, []);

  const contextValue = {
    isLoading,
    event,
    maintenance,
    serverInfos,
    isInternetConnected,
    isServerReachable,
    getInstallationStatut,
  };

  return (
    <ServerStatusContext.Provider value={contextValue}>
      <Loader isVisible={isLoading} />
      {children}
    </ServerStatusContext.Provider>
  );
};
