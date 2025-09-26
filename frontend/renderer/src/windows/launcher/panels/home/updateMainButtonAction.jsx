import { enqueueSnackbar } from "notistack";
import { useEffect, useRef } from "react";
import { useInfos } from "../../context/infos.context";

const formatBytes = (bytes) => {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  if (!bytes) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
};

function UpdateMainButtonAction({
  changeMainButtonAction,
  changeIsMainButtonDisabled,
  isDisabled,
}) {
  const { getInstallationStatut, maintenance } = useInfos();
  const installingRef = useRef(false); // <-- flag pour bloquer reload pendant l'install

  let lastUpdate = 0;
  const callback = ({ downloadedBytes, totalBytes, percent }) => {
    const now = Date.now();
    if (now - lastUpdate > 200) {
      changeMainButtonAction({
        text: `Téléchargement ${percent}% (${formatBytes(
          downloadedBytes
        )}/${formatBytes(totalBytes)})`,
      });
      lastUpdate = now;
    }
  };

  useEffect(() => {
    const error = (err) => {
      console.error(err);
      enqueueSnackbar("Erreur lors de l'installation !", { variant: "error" });
    };

    const install = async () => {
      if (installingRef.current) return; // déjà en cours
      installingRef.current = true;
      changeIsMainButtonDisabled(true);

      console.log("Installing...");
      const cleanup = () => window.electron_API.removeInstallListeners();

      try {
        window.electron_API.onInstallProgress(callback);
        window.electron_API.onInstallError((data) => {
          error(data.message);
          cleanup();
          installingRef.current = false;
        });
        window.electron_API.onInstallDone(() => {
          cleanup();
          enqueueSnackbar("Installation terminée !", { variant: "success" });
          installingRef.current = false;
          reload(); // relance le reload une seule fois après fin install
        });

        await window.electron_API.install();
      } catch (err) {
        error(err);
        cleanup();
        installingRef.current = false;
      } finally {
        changeIsMainButtonDisabled(false);
      }
    };

    const reload = async () => {
      if (installingRef.current) return; // bloquer reload pendant l'installation

      try {
        const status = await getInstallationStatut();
        const isMaintenanceEnabled = maintenance?.enabled || false;
        if (!status) return;

        const {
          isInstalled,
          isUpToDate,
          isMajorUpdate,
          isServerReachable,
          isInternetConnected,
          gameVersion,
          isAdminModsActive,
          isAdminModsInstalled,
          isAdminModsAvailable,
          isBoostfpsModsActive,
          isBoostfpsModsInstalled,
          isBoostfpsModsAvailable,
        } = status;

        // Cas 0 : En cours de chargement
        if (isServerReachable == null) return;

        // Cas 1 : Pas installé, internet OK
        if (!isInstalled && isServerReachable && isInternetConnected) {
          return changeMainButtonAction({
            text: "Installer",
            onclick: install,
            isReadyToPlay: false,
          });
        }

        // Cas 2 : Installé et à jour
        if (isInstalled && isUpToDate) {
          return changeMainButtonAction({
            text: `Jouer à la v${gameVersion}${
              isMaintenanceEnabled ? "\n(⚠️ Maintenance en cours.)" : ""
            }`,
            onclick: () => {},
            isReadyToPlay: true,
          });
        }

        // Cas 3 : Installé mais mise à jour disponible
        if (isInstalled && !isUpToDate) {
          return changeMainButtonAction({
            text: isMajorUpdate
              ? "Réinstaller\n(⚠️ Nouvelle version majeure.)"
              : "Mettre à jour",
            onclick: install,
            isReadyToPlay: false,
          });
        }

        // Cas par défaut
        return changeMainButtonAction({
          text: "Vérification...",
          onclick: reload,
          isReadyToPlay: false,
        });
      } catch (err) {
        console.error(err);
        enqueueSnackbar("Erreur lors de la vérification de la version !", {
          variant: "error",
        });
        changeMainButtonAction({
          text: "Erreur lors de la vérification",
          onclick: reload,
        });
      }
    };

    // Relance automatique toutes les 2 secondes, sauf si installation en cours
    const intervalId = setInterval(() => {
      if (!installingRef.current && !isDisabled) reload();
    }, 1000);

    reload(); // premier appel direct

    return () => clearInterval(intervalId);
  }, [
    isDisabled,
    maintenance,
    callback,
    changeIsMainButtonDisabled,
    changeMainButtonAction,
    getInstallationStatut,
  ]);

  return null;
}

export default UpdateMainButtonAction;
