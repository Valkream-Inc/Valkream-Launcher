import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
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
    if (!window.electron_API?.getInstallationStatut) {
      console.warn(
        "L'API Electron n'est pas disponible. Vérification des infos impossible."
      );
      return null;
    }

    try {
      const statut = await window.electron_API.getInstallationStatut();
      setIsInternetConnected(statut?.isInternetConnected || false);
      setIsServerReachable(statut?.isServerReachable || false);
      setLoadingState((prev) => ({ ...prev, statusLoaded: true }));
      return statut;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du statut d'installation :",
        error
      );
      setIsInternetConnected(false);
      setIsServerReachable(false);
      setLoadingState((prev) => ({ ...prev, statusLoaded: true }));
      return null;
    }
  }, []);

  const handleUpdate = useCallback((infos) => {
    setEvent(infos?.event || null);
    setMaintenance(infos?.maintenance || null);
    setServerInfos(infos?.serverInfos || null);
    setLoadingState((prev) => ({ ...prev, infosLoaded: true }));
  }, []);

  useEffect(() => {
    if (!window.electron_API?.getInfos) {
      console.warn(
        "L'API Electron n'est pas disponible. Vérification des infos impossible."
      );
      return null;
    }

    const interval = setInterval(async () => {
      const infos = await window.electron_API.getInfos();
      handleUpdate(infos);
    }, 1000);

    return () => clearInterval(interval);
  }, [getInstallationStatut, handleUpdate]);

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
