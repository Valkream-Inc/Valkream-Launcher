import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect } from "react";
import { useInfos } from "../../context/infos.context";

const formatBytes = (bytes) => {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  if (!bytes) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
};

function UpdateMainButtonAction({ changeMainButtonAction }) {
  const { getInstallationStatut, maintenance } = useInfos();

  const disabledMainButton = useCallback(() => {
    changeMainButtonAction({ isDisabled: true });
  }, [changeMainButtonAction]);

  const enableMainButton = useCallback(() => {
    changeMainButtonAction({ isDisabled: false });
  }, [changeMainButtonAction]);

  const callback = useCallback(
    ({ text, downloadedBytes, totalBytes, percent, speed }) => {
      changeMainButtonAction({
        text: `${text}\n(${percent}%) (${formatBytes(
          downloadedBytes
        )} / ${formatBytes(totalBytes)}) à ${formatBytes(speed)}/s`,
      });
    },
    [changeMainButtonAction]
  );

  useEffect(() => {
    const error = (err) => {
      console.error(err);
      enqueueSnackbar("Erreur lors de l'installation !", { variant: "error" });
    };

    const install = async () => {
      const cleanup = () => {
        window.electron_API.removeInstallListeners();
      };

      try {
        // Set up listeners first
        window.electron_API.onInstallProgress(callback);
        window.electron_API.onInstallError((data) => {
          error(data.message);
          cleanup();
        });
        window.electron_API.onInstallDone(() => {
          cleanup();
          enqueueSnackbar("Installation terminée !", { variant: "success" });
          reload();
        });

        // Now, trigger the installation process. The await ensures we wait for the process to complete.
        await window.electron_API.install();
      } catch (err) {
        // This catch block handles errors thrown by the .invoke() call itself, not the ones from the main process
        error(err);
        cleanup();
      }
    };

    const reload = async () => {
      try {
        const status = await getInstallationStatut();
        const isMaintenanceEnabled = maintenance?.enabled || false;

        if (!status) return;

        const {
          isInstalled,
          isUpToDate,
          isMajorUpdate,
          isAdminModsActive,
          isAdminModsInstalled,
          isAdminModsAvailable,
          isBoostfpsModsActive,
          isBoostfpsModsInstalled,
          isBoostfpsModsAvailable,
          isServerReachable,
          isInternetConnected,
        } = status;

        const gameVersion = isInstalled ? "2" : undefined;

        // Cas 0 : En cours de chargement
        if (isServerReachable == null || isMaintenanceEnabled == null)
          return setTimeout(reload, 100);

        // Gérer Admin Mods
        if (
          isInstalled &&
          isInternetConnected &&
          isAdminModsActive &&
          !isAdminModsInstalled &&
          isAdminModsAvailable
        ) {
          disabledMainButton();
          await window.api.installCustomMods(admin_mods, callback);
          // await ThunderstoreManager.InstallCustomMods(admin_mods, callback);
          enableMainButton();
          return reload();
        }

        // Gérer BoostFPS Mods
        if (
          isInstalled &&
          isInternetConnected &&
          isBoostfpsModsActive &&
          !isBoostfpsModsInstalled &&
          isBoostfpsModsAvailable
        ) {
          disabledMainButton();
          // await ThunderstoreManager.InstallCustomMods(boostfps_mods, callback);
          enableMainButton();
          return reload();
        }

        // Cas 2 : Pas installé et pas de connexion internet
        if (!isInstalled && (!isServerReachable || !isInternetConnected)) {
          return changeMainButtonAction({
            text: `Installation Impossible\n (❌ Pas de connexion ${
              isInternetConnected ? "au serveur" : "internet"
            }.)`,
            onclick: reload,
          });
        }

        // Cas 3 : Pas installé et internet OK
        if (!isInstalled && isServerReachable && isInternetConnected) {
          return changeMainButtonAction({
            text: "Installer",
            onclick: install, // à remplacer par install()
          });
        }

        // Cas 4 : Installé, pas internet
        if (isInstalled && (!isServerReachable || !isInternetConnected)) {
          changeMainButtonAction({
            text: `Jouer à la v${gameVersion}\n 
            (⚠️ Pas de connexion ${
              isInternetConnected ? "au serveur" : "internet"
            }.)`,
            onclick: () => {}, // start()
          });
          return;
        }

        // Cas 5 et 6 : Installé, internet, pas à jour
        if (
          isInstalled &&
          isServerReachable &&
          isInternetConnected &&
          !isUpToDate
        ) {
          changeMainButtonAction({
            text: isMajorUpdate
              ? "Réinstaller\n (⚠️ Nouvelle version majeure.)"
              : "Mettre à jour",
            onclick: () => {}, // update/install selon le cas
          });
          return;
        }

        // Cas 7 : Installé, internet, à jour
        if (
          isInstalled &&
          isServerReachable &&
          isInternetConnected &&
          isUpToDate
        ) {
          changeMainButtonAction({
            text: `Jouer à la v${gameVersion}
                  ${isMaintenanceEnabled ? "\n (⚠️ Maintenance en cours.)" : ""}
                  ${isAdminModsActive ? "\n (⚠️ Mods Admin activés.)" : ""}`,

            onclick: () => {}, // start()
          });
          return;
        }

        // Cas par défaut
        changeMainButtonAction({
          text: "Erreur inconnue, contactez le support.",
          onclick: reload,
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
      } finally {
        enableMainButton();
      }
    };

    reload();
    const intervalId = setInterval(reload, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return null;
}

export default UpdateMainButtonAction;
