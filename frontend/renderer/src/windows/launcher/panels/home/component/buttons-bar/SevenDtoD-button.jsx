/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { enqueueSnackbar } from "notistack";
import React, { useEffect, useState } from "react";

import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { ButtonBase, Stack } from "@mui/material";

import Popup from "../../../../component/popup/popup.jsx";

import { useAction } from "../../../../context/action.context.jsx";
import { useInfos } from "../../../../context/infos.context.jsx";

function WelcomeMessage() {
  return (
    <>
      Vous êtes sur le point d’installer le jeu ...
      <br />
      <br />
      Si vous avez des problèmes, n'hésitez pas à nous joindre sur notre serveur
      Discord.
    </>
  );
}

export default function SevenDtoDButton() {
  const { actionLoading, runAction } = useAction();
  const { installationStatut, maintenance } = useInfos();

  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [action, setAction] = useState({
    text: "Loading...",
    Icon: null,
    onClick: () => {},
  });

  const callback = ({ text, processedBytes, totalBytes, percent, speed }) => {
    const existProgress = processedBytes && totalBytes && percent && speed;
    setAction({
      text: existProgress
        ? `${text}\n ${percent}% (${processedBytes}/${totalBytes}) à ${speed}/s`
        : `${text}`,
      Icon: null,
      onClick: () => {},
    });
  };

  const error = (actionName, err) => {
    console.error(actionName, err);
    enqueueSnackbar(`Erreur lors de ${actionName} !`, {
      variant: "error",
    });
  };

  const selectGamePath = async () => {
    try {
      const actualGamePath = await window.electron_API.getSettings(
        "gamePathWithSevenDtoD"
      );
      const result = await window.electron_API.chooseFolder();
      if (!result || result === actualGamePath) return;

      if (
        await window.electron_SevenDtoD_API.testIsSteamGamePathValid(result)
      ) {
        // On sauvegarde le nouveau chemin
        await window.electron_API.setSettings("gamePathWithSevenDtoD", result);
        enqueueSnackbar("Chemin de jeu sauvegardé !", { variant: "info" });
      } else {
        enqueueSnackbar("Chemin invalide !", { variant: "error" });
      }
    } catch (error) {
      error("la sélection du chemin de jeu", error);
    }
  };
  const handleSelectGamePath = () =>
    runAction(selectGamePath, "SevenDtoD-select-game-path");

  const install = async () => {
    const cleanup = () =>
      window.electron_SevenDtoD_API.removeInstallListeners();
    try {
      window.electron_SevenDtoD_API.onInstallProgress(callback);
      window.electron_SevenDtoD_API.onInstallError((data) => {
        error("l'installation", data.message);
        cleanup();
      });
      window.electron_SevenDtoD_API.onInstallDone(() => {
        cleanup();
        enqueueSnackbar("Installation terminée !", { variant: "success" });
      });
      await window.electron_SevenDtoD_API.install();
      return;
    } catch (err) {
      cleanup();
      return;
    }
  };
  const handleInstall = () => runAction(install, "SevenDtoD-install");

  const start = async () => {
    const cleanup = () => window.electron_SevenDtoD_API.removePlayListeners();
    try {
      window.electron_SevenDtoD_API.onPlayProgress(callback);
      window.electron_SevenDtoD_API.onPlayError((data) => {
        error("la tentative de lancement", data.message);
        cleanup();
      });
      window.electron_SevenDtoD_API.onPlayDone(() => {
        cleanup();
        enqueueSnackbar("Lancement du jeu terminée !", { variant: "success" });
      });
      await window.electron_SevenDtoD_API.play();
      await window.electron_API.close(); // Ferme le launcher pas de launcher behaviour pour le moment
      return;
    } catch (err) {
      cleanup();
      return;
    }
  };
  const handleStart = () => runAction(start, "SevenDtoD-start");

  const update = async () => {
    const cleanup = () => window.electron_SevenDtoD_API.removeUpdateListeners();
    try {
      window.electron_SevenDtoD_API.onUpdateProgress(callback);
      window.electron_SevenDtoD_API.onUpdateError((data) => {
        error("la mise à jour", data.message);
        cleanup();
      });
      window.electron_SevenDtoD_API.onUpdateDone(() => {
        cleanup();
        enqueueSnackbar("Mise à jour terminée !", { variant: "success" });
      });
      await window.electron_SevenDtoD_API.update();
      return;
    } catch (err) {
      cleanup();
      return;
    }
  };
  const handleUpdate = () => runAction(update, "SevenDtoD-update");

  useEffect(() => {
    const run = async () => {
      try {
        if (!installationStatut) return;

        const {
          isInternetConnected,
          isServerReachable,
          isInstalled,
          isUpToDate,
          isAValidSteamGamePath,
        } = installationStatut;

        const isConnected = isInternetConnected && isServerReachable;

        // Cas 0 : En cours de chargement
        if (isServerReachable === null || maintenance === null)
          return setAction({
            text: "Loading...",
            Icon: null,
            onClick: () => {},
          });

        // Cas 1 : Pas de chemin de jeu valide
        if (!isAValidSteamGamePath)
          return setAction({
            text: "Veuillez spécifier un chemin de jeu valide !",
            Icon: FolderOpenIcon,
            onClick: handleSelectGamePath,
          });

        // Cas 2 : Pas installé et pas de connexion internet
        if (!isInstalled && !isConnected)
          return setAction({
            text: `Installation Impossible\n (❌ Pas de connexion ${
              isInternetConnected ? "au server" : "internet"
            }.)`,
            Icon: null,
            onClick: () => {},
          });

        // Cas 3 : Pas installé et internet OK
        if (!isInstalled && isConnected)
          return setAction({
            text: "Installer",
            Icon: null,
            onClick: () => setIsWelcomeOpen(true),
          });

        // Cas 4 : Installé, pas internet
        if (isInstalled && !isConnected)
          return setAction({
            text: `Jouer à 7Days to Valkream
          (⚠️ Pas de connexion ${
            isInternetConnected ? "au server" : "internet"
          }.)`,
            Icon: SportsEsportsIcon,
            onClick: handleStart,
          });

        // Cas 5 : Installé, internet, pas à jour
        if (isInstalled && isConnected && !isUpToDate)
          return setAction({
            text: "Mettre à jour",
            Icon: null,
            onClick: handleUpdate,
          });

        // Cas 6 : Installé, internet, à jour
        if (isInstalled && isConnected && isUpToDate)
          return setAction({
            text: `Jouer à 7Days to Valkream${
              maintenance?.enabled ? "\n (⚠️ Maintenance en cours.)" : ""
            }`,
            Icon: SportsEsportsIcon,
            onClick: handleStart,
          });

        // Cas par défaut
        return setAction({
          text: "Erreur inconnue, contactez le support.",
          Icon: null,
          onClick: () => {},
        });
      } catch (err) {
        console.error(err);
        enqueueSnackbar("Erreur lors de la vérification de la version !", {
          variant: "error",
        });
        return setAction({
          text: "Erreur lors de la vérification",
          Icon: null,
          onClick: () => {},
        });
      }
    };

    run();
  }, [installationStatut, maintenance]);

  return (
    <>
      <Popup
        open={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
        onConfirm={[
          () => {
            setIsWelcomeOpen(false);
            handleInstall();
          },
        ]}
        type="welcome"
        title="Bienvenue sur le launcher de Valkream ! 👋"
        message={<WelcomeMessage />}
      />
      <ButtonBase
        onClick={action.onClick}
        className="play-btn"
        disabled={actionLoading}
        disableRipple={actionLoading}
      >
        <Stack direction={"row"} spacing={1} sx={{ alignItems: "center" }}>
          {action.Icon && (
            <action.Icon fontSize="large" className="icon-play" />
          )}
          {action.text.split("\n").map((line, index) => (
            <React.Fragment key={index}>
              {line}
              {index < action.text.split("\n").length - 1 && <br />}
            </React.Fragment>
          ))}
        </Stack>
      </ButtonBase>
    </>
  );
}
