/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Bouton principal de l'accueil, identique pour tous les jeux : installer,
 * réinstaller, mettre à jour ou jouer selon le statut de l'instance active.
 */

import { enqueueSnackbar } from "notistack";
import React, { useEffect, useRef, useState } from "react";

import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import { Box, Button, ButtonBase, Stack } from "@mui/material";
import type { InstanceSyncProgress, SteamSourceIssue } from "@shared/types";

import Popup from "../../../../component/popup/popup";

import { instanceText } from "@/src/i18n";
import { notify } from "@/src/utils/notify";
import { useTranslation } from "react-i18next";
import { useAction } from "../../../../context/action.context";
import { useBackground } from "../../../../context/background.context";
import { useGames } from "../../../../context/games.context";
import { useInfos } from "../../../../context/infos.context";
import type { InstanceButtonAction } from "./instance-button.types";
import SteamSourceDialog, { type DepotRunState } from "./steam-source-dialog";

/** 75 s → "1:15", 3725 s → "1:02:05". */
const formatElapsed = (ms: number): string => {
  const total = Math.floor(ms / 1000);
  const [h, m, sec] = [
    Math.floor(total / 3600),
    Math.floor((total % 3600) / 60),
    total % 60,
  ];
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
};

const LOADING_ACTION: InstanceButtonAction = {
  text: "Loading...",
  playIcon: false,
  onClick: () => {},
};

export default function InstanceButton() {
  const { t, i18n } = useTranslation();
  const { actionLoading, runAction } = useAction();
  const { pause, play } = useBackground();
  const {
    actualInstanceId,
    actualInstance,
    actualChannel,
    gamesRootMove,
    refreshChannel,
  } = useGames();
  const { installationStatut, maintenance } = useInfos();

  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  // `t` toujours à jour : les rafraîchissements du bouton pendant une action (horloge, progression) tournent dans
  // des fermetures anciennes, qui garderaient sinon la langue d'origine après un changement de langue.
  const tRef = useRef(t);
  tRef.current = t;
  const [action, setAction] = useState<InstanceButtonAction>(LOADING_ACTION);
  const [syncing, setSyncing] = useState(false);
  // Jeu Steam absent / autre version : solutions proposées au joueur
  const [steamIssue, setSteamIssue] = useState<SteamSourceIssue | null>(null);
  // Popup Steam masquable : le téléchargement DepotDownloader continue, le bouton principal le rouvre
  const [steamOpen, setSteamOpen] = useState(false);
  // Échecs d'installation autres que Steam : détaillés dans un popup (jamais sur le bouton)
  const [syncErrors, setSyncErrors] = useState<string[]>([]);
  const [depotState, setDepotState] = useState<DepotRunState>({
    running: false,
    percent: null,
    step: null,
  });

  // Dernier état de progression + horloge locale : le temps écoulé avance chaque seconde,
  // même quand aucune progression n'arrive (extraction, vérification…).
  const syncStartedAt = useRef(0);
  const lastProgress = useRef<{
    text: string;
    progress?: InstanceSyncProgress;
  }>({ text: "" });

  // « Jouer » ou « Jouer à la vX » selon la version connue
  const playLabel = (version?: string | null) =>
    version ? t("button.playVersion", { version }) : t("button.play");

  const render = () => {
    const t = tRef.current;
    // `text` est une CLÉ de traduction (traduite ici, dans la langue courante)
    const { text: actionKey, progress } = lastProgress.current;
    const actionName = actionKey ? (t as unknown as (k: string) => string)(actionKey) : "";
    // Message traduit ICI (pas dans le main) : un changement de langue en cours de synchronisation
    // est pris en compte au prochain rafraîchissement (chaque seconde au plus).
    const rank =
      progress && progress.total > 0
        ? ` (${progress.index}/${progress.total})`
        : "";
    const translateProgress = (key: string, vars?: object): string => {
      const translate = t as unknown as (
        k: string,
        options?: Record<string, unknown>,
      ) => string;

      return translate(key, vars as Record<string, unknown> | undefined);
    };

    // Une erreur est détaillée dans un popup / une notification, jamais en entier sur le bouton
    const shortText = (value: string): string =>
      value.length > 60 ? `${value.slice(0, 57)}…` : value;
    const text = progress?.step === "error"
      ? shortText(actionName)
      : progress
      ? `${progress.messageKey ? translateProgress(progress.messageKey, progress.messageVars) : (progress.message ?? actionName)}${rank}`
      : actionName;
    const transfer = progress?.transfer;
    const elapsed = `⏱ ${formatElapsed(Date.now() - syncStartedAt.current)}`;
    // Progression globale : pourcentage, cumul d'octets (total connu seulement pour un fichier unique)
    const hasTransfer = transfer && (transfer.percent > 0 || transfer.processedBytes);
    const details = hasTransfer
      ? `\n ${t("button.speed", { percent: transfer.percent, done: transfer.processedBytes, total: transfer.totalBytes ? `/${transfer.totalBytes}` : "", speed: transfer.speed })} · ${elapsed}`
      : `\n ${elapsed}`;
    setAction({
      text: `${text}${details}`,
      playIcon: false,
      onClick: () => {},
    });
  };

  const callback = (actionKey: string, progress?: InstanceSyncProgress) => {
    lastProgress.current = { text: actionKey, progress };
    render();
  };

  const error = (actionName: string, err: unknown) => {
    console.error(actionName, err);
    enqueueSnackbar(t("button.errorDuring", { action: actionName }), {
      variant: "error",
    });
  };

  // Installation, réinstallation et mise à jour : une même synchronisation
  const sync = async (actionKey: string, doneKey: string) => {
    const translate = t as unknown as (k: string) => string;
    const actionName = translate(actionKey);
    const doneText = translate(doneKey);
    const cleanup = () => window.electron_API.removeInstanceProgressListeners();

    let clock: ReturnType<typeof setInterval> | undefined;
    try {
      setSyncing(true);
      setSyncErrors([]); // les erreurs de la tentative précédente ne restent pas affichées
      syncStartedAt.current = Date.now();
      lastProgress.current = { text: actionKey };
      render();
      clock = setInterval(render, 1000);
      window.electron_API.onInstanceProgress((progress) => {
        if (
          progress.id !== actualInstanceId ||
          progress.channel !== actualChannel
        )
          return;
        callback(actionKey, progress);
      });

      const result = await window.electron_API.syncInstance(
        actualInstanceId,
        actualChannel,
      );
      if (result.cancelled) {
        enqueueSnackbar(t("button.cancelled"), { variant: "info" });
      } else if (result.failed.some((item) => item.steamIssue)) {
        setSteamIssue(
          result.failed.find((item) => item.steamIssue)?.steamIssue ?? null,
        );
        setSteamOpen(true);
        notify(t("notify.actionTitle"), t("notify.steamAction"));
      } else if (result.failed.length > 0) {
        error(actionName, result.failed.map((item) => item.name).join(", "));
        notify(t("notify.errorTitle"), result.failed.map((item) => item.name).join(", "));
        setSyncErrors(result.failed.map((item) => `${item.name} : ${item.error}`));
      } else {
        enqueueSnackbar(doneText, { variant: "success" });
        notify(t("notify.doneTitle"), doneText);
      }
    } catch (err) {
      error(actionName, err);
      notify(t("notify.errorTitle"), actionName);
    } finally {
      clearInterval(clock);
      cleanup();
      setSyncing(false);
      // Statut et infos relus tout de suite (sinon le bouton garde l'ancien état après la fin)
      void refreshChannel();
    }
  };

  const cancel = () =>
    window.electron_API.cancelInstanceSync(actualInstanceId, actualChannel);

  const handleInstall = () =>
    runAction(
      () => sync("button.installing", "button.installDone"),
      `${actualInstanceId}-install`,
    );

  const handleUpdate = () =>
    runAction(
      () => sync("button.updating", "button.updateDone"),
      `${actualInstanceId}-update`,
    );

  const start = async () => {
    let hidden = false;
    try {
      // Le comportement du launcher est un réglage de l'installation
      const report = await window.electron_API.getInstanceReport(
        actualInstanceId,
        actualChannel,
      );
      hidden = report.settings.launcherBehavior === "hide";

      if (hidden) pause();
      await window.electron_API.launchInstance(actualInstanceId, actualChannel);
    } catch (err) {
      console.error("Erreur lors du démarrage du jeu :", err);
      enqueueSnackbar(t("button.launchError"), {
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
          (setting.category?.zone ?? "normal") === "danger" &&
          activeSettings.includes(setting.settingsName),
      )
      .map((setting) =>
        t("button.dangerActive", {
          label: instanceText(actualInstanceId, setting.label),
        }),
      )
      .join("");

  useEffect(() => {
    const run = async () => {
      try {
        if (actionLoading) return;

        // Déplacement du dossier des jeux : ni lancement ni installation tant qu'il n'est pas terminé
        if (gamesRootMove.active) {
          const percent =
            gamesRootMove.total > 0
              ? Math.floor((gamesRootMove.done / gamesRootMove.total) * 100)
              : 0;
          return setAction({
            text: t("button.moving", { percent }),
            playIcon: false,
            onClick: () => {},
          });
        }

        // Téléchargement DepotDownloader en cours (popup masqué) : un clic le rouvre
        if (depotState.running) {
          return setAction({
            text: t("steam.depotRunning", {
              percent:
                depotState.percent === null
                  ? "…"
                  : `${depotState.percent.toFixed(1)} %`,
            }),
            playIcon: false,
            onClick: () => setSteamOpen(true),
          });
        }

        // Jeu Steam à fournir (popup fermé) : un clic le rouvre
        if (steamIssue !== null && !steamOpen) {
          return setAction({
            text: t("steam.reopen"),
            playIcon: false,
            onClick: () => setSteamOpen(true),
          });
        }

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
            text: t("button.cannotInstall", {
              what: isInternetConnected
                ? t("button.toServer")
                : t("button.toInternet"),
            }),
            playIcon: false,
            onClick: () => {},
          });

        // Cas 2 : Pas installé et internet OK
        if (!isInstalled && isConnected)
          return setAction({
            text: t("button.install"),
            playIcon: false,
            onClick: () => setIsWelcomeOpen(true),
          });

        // Cas 3 : Installé, pas internet
        if (isInstalled && !isConnected)
          return setAction(
            canPlay
              ? {
                  text: t("button.playOffline", {
                    play: playLabel(gameVersion),
                    what: isInternetConnected
                      ? t("button.toServer")
                      : t("button.toInternet"),
                  }),
                  playIcon: true,
                  onClick: handleStart,
                }
              : {
                  text: t("button.incomplete"),
                  playIcon: false,
                  onClick: () => {},
                },
          );

        // Cas 4 : Installé, internet, pas à jour (majeur)
        if (isInstalled && isConnected && !isUpToDate && isMajorUpdate)
          return setAction({
            text: t("button.reinstall"),
            playIcon: false,
            onClick: handleInstall,
          });

        // Cas 5 : Installé, internet, pas à jour (mineur)
        if (isInstalled && isConnected && !isUpToDate && !isMajorUpdate)
          return setAction({
            text: t("button.update"),
            playIcon: false,
            onClick: handleUpdate,
          });

        // Cas 6 : Installé, internet, à jour
        if (isInstalled && isConnected && isUpToDate)
          return setAction({
            text: `${playLabel(gameVersion)}${
              maintenance && maintenance.enabled ? t("button.maintenance") : ""
            }${dangerWarnings(activeOptionalSettings)}`,
            playIcon: true,
            onClick: handleStart,
          });

        // Cas par défaut
        return setAction({
          text: t("button.unknown"),
          playIcon: false,
          onClick: () => {},
        });
      } catch (err) {
        console.error(err);
        enqueueSnackbar(t("button.checkErrorToast"), {
          variant: "error",
        });
        return setAction({
          text: t("button.checkError"),
          playIcon: false,
          onClick: () => {},
        });
      }
    };

    run();
  }, [
    installationStatut,
    maintenance,
    actualInstanceId,
    actualChannel,
    i18n.language,
    gamesRootMove.active,
    gamesRootMove.done,
    depotState.running,
    depotState.percent,
    steamIssue,
    steamOpen,
  ]);

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
        title={t("button.welcome")}
        message={actualInstance.welcomeContent}
      />
      <Popup
        open={syncErrors.length > 0}
        onClose={() => setSyncErrors([])}
        type="error"
        title={t("button.errorTitle")}
        message={
          <Box component="ul" sx={{ textAlign: "left", m: 0, pl: 2.5, maxHeight: "50vh", overflowY: "auto" }}>
            {syncErrors.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </Box>
        }
      />
      <SteamSourceDialog
        issue={steamIssue}
        open={steamOpen}
        onDepotState={setDepotState}
        instanceId={actualInstanceId}
        channel={actualChannel}
        onClose={() => setSteamOpen(false)}
        onRetry={() => {
          // Source prête (ou nouvelle tentative) : popup fermé, l'installation continue sur le bouton
          setSteamIssue(null);
          setSteamOpen(false);
          handleInstall();
        }}
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

      {syncing && (
        <Button color="error" variant="contained" size="large" onClick={cancel}>
          Annuler
        </Button>
      )}
    </>
  );
}
