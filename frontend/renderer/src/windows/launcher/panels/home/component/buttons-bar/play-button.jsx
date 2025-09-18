import React, { useState, useEffect, useRef } from "react";
import { enqueueSnackbar } from "notistack";

import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import { ButtonBase, Stack } from "@mui/material";

import Popup from "../../../../component/popup/popup";

import { useAction } from "../../../../context/action.context.jsx";
import { useInfos } from "../../../../context/infos.context.jsx";
import { useBackground } from "../../../../context/background.context.jsx";

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

export default function PlayButton() {
  const { actionLoading, runAction } = useAction();
  const { pause, play } = useBackground();
  const { installationStatut, maintenance } = useInfos();

  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [action, setAction] = useState({
    text: "Loading...",
    playIcon: false,
    onClick: () => {},
  });

  const callback = ({ text, processedBytes, totalBytes, percent, speed }) => {
    const existProgress = processedBytes && totalBytes && percent && speed;
    setAction({
      text: existProgress
        ? `${text}\n ${percent}% (${processedBytes}/${totalBytes}) à ${speed}/s`
        : `${text}`,
      playIcon: false,
      onClick: () => {},
    });
  };

  const error = (actionName, err) => {
    console.error(actionName, err);
    enqueueSnackbar(`Erreur lors de ${actionName} !`, {
      variant: "error",
    });
  };

  const install = async () => {
    const cleanup = () => window.electron_API.removeInstallListeners();

    try {
      window.electron_API.onInstallProgress(callback);
      window.electron_API.onInstallError((data) => {
        error("l'installation", data.message);
        cleanup();
      });
      window.electron_API.onInstallDone(() => {
        cleanup();
        enqueueSnackbar("Installation terminée !", { variant: "success" });
      });

      await window.electron_API.install();
      return;
    } catch (err) {
      cleanup();
      return;
    }
  };
  const handleInstall = () => runAction(install, "install");

  const start = async () => {
    try {
      const launcherBehavior = await window.electron_API.getSettings(
        "launcherBehavior"
      );

      if (launcherBehavior === "hide") pause();
      await window.electron_API.start();
      if (launcherBehavior === "hide") play();
    } catch (err) {
      console.error("Erreur lors du démarrage du jeu :", err);
      showSnackbar("Erreur lors du lancement du jeu !", "error");
    }
  };
  const handleStart = () => runAction(start, "start");

  const update = async () => {
    const cleanup = () => window.electron_API.removeUpdateListeners();

    try {
      window.electron_API.onUpdateProgress(callback);
      window.electron_API.onUpdateError((data) => {
        error("la mise à jour", data.message);
        cleanup();
      });
      window.electron_API.onUpdateDone(() => {
        cleanup();
        enqueueSnackbar("Mise à jour terminée !", { variant: "success" });
      });

      await window.electron_API.update();
      return;
    } catch (err) {
      cleanup();
      return;
    }
  };
  const handleUpdate = () => runAction(update, "update");

  const modsRunningRef = useRef(false);
  const customMods = async () => {
    modsRunningRef.current = true;
    const cleanup = () => window.electron_API.removeCustomModsListeners();

    await new Promise((resolve) => setTimeout(resolve, 1500));
    try {
      window.electron_API.onCustomModsProgress(callback);
      window.electron_API.onCustomModsError((data) => {
        error("l'actualisation des mods", data.message);
        cleanup();
      });
      window.electron_API.onCustomModsDone(() => {
        cleanup();
        enqueueSnackbar("Actualisation des mods terminée !", {
          variant: "success",
        });
      });

      await window.electron_API.customMods();
    } catch (err) {
      cleanup();
    } finally {
      modsRunningRef.current = false;
      return;
    }
  };
  const handleCustomMods = () => runAction(customMods, "custom-mods");

  useEffect(() => {
    const run = async () => {
      try {
        if (modsRunningRef.current) return;
        if (!installationStatut) return;

        const {
          isInstalled,
          isUpToDate,
          isMajorUpdate,
          isServerReachable,
          isInternetConnected,
          gameVersion,
          isAdminModsActive,
          isCustomModsToInstall,
          isCustomModsToUninstall,
        } = installationStatut;

        const isConnected = isInternetConnected && isServerReachable;

        // Cas 0 : En cours de chargement
        if (isServerReachable === null || maintenance === null)
          return setAction({
            text: "Loading...",
            playIcon: false,
            onClick: () => {},
          });

        // cas 1: Mods gestion
        if (isCustomModsToInstall || isCustomModsToUninstall) {
          callback({ text: "Actualisation des mods..." });
          await handleCustomMods();
          return;
        }

        // Cas 2 : Pas installé et pas de connexion internet
        if (!isInstalled && !isConnected)
          return setAction({
            text: `Installation Impossible\n (❌ Pas de connexion ${
              isInternetConnected ? "au server" : "internet"
            }.)`,
            playIcon: false,
            onClick: () => {},
          });

        // Cas 3 : Pas installé et internet OK
        if (!isInstalled && isConnected)
          return setAction({
            text: "Installer",
            playIcon: false,
            onClick: () => setIsWelcomeOpen(true),
          });

        // Cas 4 : Installé, pas internet
        if (isInstalled && !isConnected)
          return setAction({
            text: `Jouer à la v${gameVersion}
          (⚠️ Pas de connexion ${
            isInternetConnected ? "au server" : "internet"
          }.)`,
            playIcon: false,
            onClick: handleStart,
          });

        // Cas 5 : Installé, internet, pas à jour (majeur)
        if (isInstalled && isConnected && !isUpToDate && isMajorUpdate)
          return setAction({
            text: "Réinstaller\n (⚠️ Nouvelle version majeure.)",
            playIcon: false,
            onClick: handleInstall,
          });

        // Cas 6 : Installé, internet, pas à jour (mineur)
        if (isInstalled && isConnected && !isUpToDate && !isMajorUpdate)
          return setAction({
            text: "Mettre à jour",
            playIcon: false,
            onClick: handleUpdate,
          });

        // Cas 7 : Installé, internet, à jour
        if (isInstalled && isConnected && isUpToDate)
          return setAction({
            text: `Jouer à la v${gameVersion} 
          ${maintenance?.enabled ? "(⚠️ Maintenance en cours.)" : ""}
          ${isAdminModsActive ? "(⚠️ Mods Admin activés.)" : ""}`,
            playIcon: true,
            onClick: handleStart,
          });

        // Cas par défaut
        return setAction({
          text: "Erreur inconnue, contactez le support.",
          playIcon: false,
          onClick: () => {},
        });
      } catch (err) {
        console.error(err);
        enqueueSnackbar("Erreur lors de la vérification de la version !", {
          variant: "error",
        });
        return setAction({
          text: "Erreur lors de la vérification",
          playIcon: false,
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
          {action.playIcon && (
            <SportsEsportsIcon fontSize="large" className="icon-play" />
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
