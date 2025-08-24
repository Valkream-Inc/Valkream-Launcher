import React, { createContext, useContext, useState, useEffect } from "react";
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
  const [installationStatut, setInstallationStatut] = useState(null);

  // A single isLoading boolean derived from the loadingState flags
  const isLoading = !(loadingState.infosLoaded && loadingState.statusLoaded);

  useEffect(() => {
    if (
      window.electron_API &&
      window.electron_API.onUpdateInfos &&
      window.electron_API.checkInfos &&
      window.electron_API.getInstallationStatut
    ) {
      const handleUpdate = (infos) => {
        setEvent(infos.event || null);
        setMaintenance(infos.maintenance || null);
        setServerInfos(infos.serverInfos || null);
        setIsInternetConnected(infos.isInternetConnected || false);
        setIsServerReachable(infos.isServerReachable || false);
        setLoadingState((prevState) => ({ ...prevState, infosLoaded: true }));
      };

      window.electron_API.onUpdateInfos(handleUpdate);
      window.electron_API.checkInfos();

      getInstallationStatut();
    } else {
      console.warn(
        "L'API Electron n'est pas disponible. Vérification des infos impossible."
      );
      setLoadingState({ infosLoaded: true, statusLoaded: true });
    }
  }, []);

  const getInstallationStatut = async () => {
    const statut = await window.electron_API.getInstallationStatut();
    setInstallationStatut(statut || null);
    setLoadingState((prevState) => ({ ...prevState, statusLoaded: true }));
  };

  const contextValue = {
    isLoading,
    event,
    maintenance,
    serverInfos,
    isInternetConnected,
    isServerReachable,
    installationStatut,
    getInstallationStatut,
  };

  return (
    <ServerStatusContext.Provider value={contextValue}>
      <Loader isVisible={isLoading} />
      {children}
    </ServerStatusContext.Provider>
  );
};
