import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect } from "react";
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

  const callback = useCallback(
    ({ text, downloadedBytes, totalBytes, percent, speed }) => {
      changeMainButtonAction({
        text: `${text}\n(${percent}%) (${formatBytes(
          downloadedBytes
        )} / ${formatBytes(totalBytes)}) à ${formatBytes(speed)}/s`,
        isReadyToPlay: false,
        onclick: () => {},
      });
    },
    []
  );

  useEffect(() => {
    const error = (err) => {
      console.error(err);
      enqueueSnackbar("Erreur lors de l'installation !", { variant: "error" });
    };

    const install = async () => {
      changeIsMainButtonDisabled(true);
      console.log("Installing...");
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
      } finally {
        changeIsMainButtonDisabled(false);
      }
    };

    const reload = async () => {
      console.log("reload...");
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
          changeIsMainButtonDisabled(true);
          await window.api.installCustomMods(admin_mods, callback);
          // await ThunderstoreManager.InstallCustomMods(admin_mods, callback);
          changeIsMainButtonDisabled(CSSFontFeatureValuesRule);
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
          changeIsMainButtonDisabled(true);
          // await ThunderstoreManager.InstallCustomMods(boostfps_mods, callback);
          changeIsMainButtonDisabled(false);
          return reload();
        }

        // Cas 2 : Pas installé et pas de connexion internet
        if (!isInstalled && (!isServerReachable || !isInternetConnected))
          return changeMainButtonAction({
            text: `Installation Impossible\n (❌ Pas de connexion ${
              isInternetConnected ? "au serveur" : "internet"
            }.)`,
            onclick: reload,
            isReadyToPlay: false,
          });

        // Cas 3 : Pas installé et internet OK
        if (!isInstalled && isServerReachable && isInternetConnected)
          return changeMainButtonAction({
            text: "Installer",
            onclick: install, // à remplacer par install()
            isReadyToPlay: false,
          });

        // Cas 4 : Installé, pas internet
        if (isInstalled && (!isServerReachable || !isInternetConnected))
          return changeMainButtonAction({
            text: `Jouer à la v${gameVersion}\n 
            (⚠️ Pas de connexion ${
              isInternetConnected ? "au serveur" : "internet"
            }.)`,
            onclick: () => {}, // start()
            isReadyToPlay: true,
          });

        // Cas 5 et 6 : Installé, internet, pas à jour
        if (
          isInstalled &&
          isServerReachable &&
          isInternetConnected &&
          !isUpToDate
        )
          return changeMainButtonAction({
            text: isMajorUpdate
              ? "Réinstaller\n (⚠️ Nouvelle version majeure.)"
              : "Mettre à jour",
            onclick: () => {}, // update/install selon le cas
          });

        // Cas 7 : Installé, internet, à jour
        if (
          isInstalled &&
          isServerReachable &&
          isInternetConnected &&
          isUpToDate
        )
          return changeMainButtonAction({
            text: `Jouer à la v${gameVersion}
                  ${isMaintenanceEnabled ? "\n (⚠️ Maintenance en cours.)" : ""}
                  ${isAdminModsActive ? "\n (⚠️ Mods Admin activés.)" : ""}`,

            onclick: () => {}, // start()
            isReadyToPlay: true,
          });

        // Cas par défaut
        return changeMainButtonAction({
          text: "Erreur inconnue, contactez le support.",
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

    reload();
    const intervalId = setInterval(() => {
      if (isDisabled) return;
      else reload();
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isDisabled, maintenance]);

  return null;
}

export default UpdateMainButtonAction;
