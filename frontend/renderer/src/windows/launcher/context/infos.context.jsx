import React, { createContext, useContext, useEffect, useState } from "react";
import Loader from "../component/loader/loader";
import { useAction } from "./action.context.jsx";
import { useGames } from "./games.context.jsx";

const InfosContext = createContext(undefined);
export const useInfos = () => useContext(InfosContext);

export const InfosProvider = ({ children }) => {
  const [loadingState, setLoadingState] = useState({
    infosLoaded: false,
    installationStatusLoaded: false,
  });
  const { actionLoading } = useAction();
  const { actualGame } = useGames();

  const [event, setEvent] = useState(null);
  const [maintenance, setMaintenance] = useState(null);
  const [serverInfos, setServerInfos] = useState(null);
  const [isInternetConnected, setIsInternetConnected] = useState(null);
  const [isServerReachable, setIsServerReachable] = useState(null);
  const [installationStatut, setInstallationStatut] = useState(null);

  const isLoading = !(
    loadingState.infosLoaded && loadingState.installationStatusLoaded
  );

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

    const getAllInfos = async () => {
      try {
        // get installation statut
        if (!actionLoading) {
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
      <Loader isVisible={isLoading} />
      {children}
    </InfosContext.Provider>
  );
};
