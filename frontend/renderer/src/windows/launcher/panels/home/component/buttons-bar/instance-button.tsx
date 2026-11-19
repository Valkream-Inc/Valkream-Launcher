/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Bouton principal de l'accueil, identique pour tous les jeux : installer,
 * réinstaller, mettre à jour ou jouer selon le statut de l'instance active.
 */

import { enqueueSnackbar } from "notistack";
import React, { useEffect, useState } from "react";

import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import { ButtonBase, Stack } from "@mui/material";
import type { InstanceSyncProgress } from "@shared/types";

import Popup from "../../../../component/popup/popup";

import { useAction } from "../../../../context/action.context";
import { useBackground } from "../../../../context/background.context";
import { useGames } from "../../../../context/games.context";
import { useInfos } from "../../../../context/infos.context";
import type { InstanceButtonAction } from "./instance-button.types";

const LOADING_ACTION: InstanceButtonAction = {
  text: "Loading...",
  playIcon: false,
  onClick: () => {},
};

export default function InstanceButton() {
  const { actionLoading, runAction } = useAction();
  const { pause, play } = useBackground();
  const { actualInstanceId, actualInstance, actualChannel } = useGames();
  const { installationStatut, maintenance } = useInfos();

  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [action, setAction] = useState<InstanceButtonAction>(LOADING_ACTION);

  const callback = (text: string, progress?: InstanceSyncProgress) => {
    const transfer = progress?.transfer;
    const existProgress =
      transfer?.processedBytes &&
      transfer?.totalBytes &&
      transfer?.percent &&
      transfer?.speed;
    setAction({
      text: existProgress
        ? `${text}\n ${transfer.percent}% (${transfer.processedBytes}/${transfer.totalBytes}) à ${transfer.speed}/s`
        : `${text}`,
      playIcon: false,
      onClick: () => {},
    });
  };

  const error = (actionName: string, err: unknown) => {
    console.error(actionName, err);
    enqueueSnackbar(`Erreur lors de ${actionName} !`, {
      variant: "error",
    });
  };

  // Installation, réinstallation et mise à jour : une même synchronisation
  const sync = async (actionName: string, doneText: string) => {
    const cleanup = () => window.electron_API.removeInstanceProgressListeners();

    try {
      window.electron_API.onInstanceProgress((progress) => {
        if (
          progress.id !== actualInstanceId ||
          progress.channel !== actualChannel
        )
          return;
        const rank =
          progress.total > 0 ? ` (${progress.index}/${progress.total})` : "";
        callback(`${progress.message ?? actionName}${rank}`, progress);
      });

      const result = await window.electron_API.syncInstance(
        actualInstanceId,
        actualChannel
      );
      if (result.failed.length > 0) {
        error(
          actionName,
          result.failed.map((item) => `${item.name} (${item.error})`).join(", ")
        );
      } else {
        enqueueSnackbar(doneText, { variant: "success" });
      }
    } catch (err) {
      error(actionName, err);
    } finally {
      cleanup();
    }
  };

  const handleInstall = () =>
    runAction(
      () => sync("l'installation", "Installation terminée !"),
      `${actualInstanceId}-install`
    );

  const handleUpdate = () =>
    runAction(
      () => sync("la mise à jour", "Mise à jour terminée !"),
      `${actualInstanceId}-update`
    );

  const start = async () => {
    let hidden = false;
    try {
      // Le comportement du launcher est un réglage de l'installation
      const report = await window.electron_API.getInstanceReport(
        actualInstanceId,
        actualChannel
      );
      hidden = report.settings.launcherBehavior === "hide";

      if (hidden) pause();
      await window.electron_API.launchInstance(actualInstanceId, actualChannel);
    } catch (err) {
      console.error("Erreur lors du démarrage du jeu :", err);
      enqueueSnackbar("Erreur lors du lancement du jeu !", {
        variant: "error",
      });
    } finally {
      if (hidden) play();
    }
  };
  const handleStart = () => runAction(start, `${actualInstanceId}-start`);

  // Réglages « danger » activés (ex : mods admin) : rappelés sur le bouton Jouer
  const dangerWarnings = (activeSettings: string[]) =>
    (actualInstance.customGamesSettings ?? [])
      .filter(
        (setting) =>
          setting.level === "danger" &&
          activeSettings.includes(setting.settingsName)
      )
      .map((setting) => `\n (⚠️ ${setting.label} activés.)`)
      .join("");

  useEffect(() => {
    const run = async () => {
      try {
        if (actionLoading) return;

        // Cas 0 : En cours de chargement
        if (!installationStatut || maintenance === null)
          return setAction(LOADING_ACTION);

        const {
          isInstalled,
          isUpToDate,
          isMajorUpdate,
          isServerReachable,
          isInternetConnected,
          gameVersion,
          activeOptionalSettings,
          canPlay,
        } = installationStatut;

        const isConnected = isInternetConnected && isServerReachable;

        // Cas 1 : Pas installé et pas de connexion internet
        if (!isInstalled && !isConnected)
          return setAction({
            text: `Installation Impossible\n (❌ Pas de connexion ${
              isInternetConnected ? "au server" : "internet"
            }.)`,
            playIcon: false,
            onClick: () => {},
          });

        // Cas 2 : Pas installé et internet OK
        if (!isInstalled && isConnected)
          return setAction({
            text: "Installer",
            playIcon: false,
            onClick: () => setIsWelcomeOpen(true),
          });

        // Cas 3 : Installé, pas internet
        if (isInstalled && !isConnected)
          return setAction(
            canPlay
              ? {
                  text: `Jouer${gameVersion ? ` à la v${gameVersion}` : ""}
          (⚠️ Pas de connexion ${
            isInternetConnected ? "au server" : "internet"
          }.)`,
                  playIcon: true,
                  onClick: handleStart,
                }
              : {
                  text: "Installation incomplète\n (❌ Connexion requise.)",
                  playIcon: false,
                  onClick: () => {},
                }
          );

        // Cas 4 : Installé, internet, pas à jour (majeur)
        if (isInstalled && isConnected && !isUpToDate && isMajorUpdate)
          return setAction({
            text: "Réinstaller\n (⚠️ Nouvelle version majeure.)",
            playIcon: false,
            onClick: handleInstall,
          });

        // Cas 5 : Installé, internet, pas à jour (mineur)
        if (isInstalled && isConnected && !isUpToDate && !isMajorUpdate)
          return setAction({
            text: "Mettre à jour",
            playIcon: false,
            onClick: handleUpdate,
          });

        // Cas 6 : Installé, internet, à jour
        if (isInstalled && isConnected && isUpToDate)
          return setAction({
            text: `Jouer${gameVersion ? ` à la v${gameVersion}` : ""}${
              maintenance && maintenance.enabled ? "\n (⚠️ Maintenance en cours.)" : ""
            }${dangerWarnings(activeOptionalSettings)}`,
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
  }, [installationStatut, maintenance, actualInstanceId, actualChannel]);

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
        message={actualInstance.welcomeContent}
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
