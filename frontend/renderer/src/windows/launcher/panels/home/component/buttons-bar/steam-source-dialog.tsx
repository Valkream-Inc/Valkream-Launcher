/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Le jeu du joueur est absent ou d'une autre version (`steam_library`) : trois solutions.
 * 1. mode d'emploi (Markdown) pour installer la bonne version dans Steam ;
 * 2. localiser une installation (dossier choisi, jamais modifié, fichiers en trop ignorés) ;
 * 3. DepotDownloader : version exacte téléchargée depuis Steam, connexion par QR code.
 */

import React, { useEffect, useRef, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import type { Channel, DepotInfo, DepotStepName, InstanceId, SteamSourceIssue } from "@shared/types";

import { ipcErrorMessage } from "../../../../../../i18n/ipc-error";
import SimpleMarkdown from "./simple-markdown";
import { useTranslation } from "react-i18next";

interface Props {
  issue: SteamSourceIssue | null;
  instanceId: InstanceId;
  channel: Channel;
  onClose: () => void;
  /** Une source est prête : on relance l'installation. */
  onRetry: () => void;
}

/** Numéro d'étape affiché (outil, connexion, téléchargement, vérification). */
const STEP_NUMBER: Record<DepotStepName, number> = {
  "tool-verify": 1,
  "tool-download": 1,
  "tool-extract": 1,
  login: 2,
  download: 3,
  finish: 4,
};

const INFO_KEY = "valkream.depot-info-accepted";

const infoAccepted = (): boolean => {
  try {
    return localStorage.getItem(INFO_KEY) === "1";
  } catch {
    return false;
  }
};

/** Lignes gardées à l'écran : assez pour le QR code (une trentaine de lignes). */
const MAX_LINES = 60;

export default function SteamSourceDialog({ issue, instanceId, channel, onClose, onRetry }: Props) {
  const { t } = useTranslation();
  const [depotRunning, setDepotRunning] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [percent, setPercent] = useState<number | null>(null);
  const [step, setStep] = useState<DepotStepName | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<DepotInfo | null>(null); // écran d'information (première utilisation)
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      window.electron_API.removeDepotOutputListeners();
    };
  }, []);

  const pickFolder = async () => {
    setError(null);
    try {
      const folder = await window.electron_API.pickInstanceSource(instanceId, channel);
      if (folder) onRetry();
    } catch (err) {
      setError(ipcErrorMessage(err));
    }
  };

  // Première utilisation : écran d'information d'abord (ce qui est exécuté, où, avec quelles garanties).
  const askDepot = async () => {
    if (infoAccepted()) return startDepot();
    try {
      setInfo(await window.electron_API.getDepotInfo(instanceId, channel));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const acceptInfo = () => {
    try {
      localStorage.setItem(INFO_KEY, "1");
    } catch {
      /* stockage indisponible : l'écran sera réaffiché */
    }
    setInfo(null);
    void startDepot();
  };

  const startDepot = async () => {
    setError(null);
    setLines([]);
    setPercent(null);
    setStep(null);
    setDepotRunning(true);
    window.electron_API.onDepotOutput((data) => {
      if (data.id !== instanceId || data.channel !== channel || !mounted.current) return;
      if (data.line !== undefined) setLines((previous) => [...previous, data.line as string].slice(-MAX_LINES));
      if (data.step !== undefined) {
        setStep(data.step);
        setPercent(null); // chaque étape repart de zéro (le pourcentage de l'outil n'est pas celui du jeu)
      }
      if (data.percent !== undefined) setPercent(data.percent);
    });
    try {
      await window.electron_API.depotDownloadInstance(instanceId, channel);
      if (mounted.current) onRetry();
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : String(err));
    } finally {
      window.electron_API.removeDepotOutputListeners();
      if (mounted.current) setDepotRunning(false);
    }
  };

  const cancelDepot = () => window.electron_API.cancelDepotDownload(instanceId, channel);

  return (
    <Dialog open={issue !== null} onClose={depotRunning ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t("steam.dialogTitle")}</DialogTitle>
      <DialogContent dividers>
        {issue && <SimpleMarkdown source={issue.guide} />}
        {depotRunning && (
          <Stack spacing={1} sx={{ mt: 2 }}>
            <Alert severity="info">
              {step
                ? `${t("steam.stepCount", { current: STEP_NUMBER[step], total: 4 })} — ${t(`steam.step.${step}`)}`
                : t("steam.step.tool-verify")}
            </Alert>
            {step === "login" && <Alert severity="warning">{t("steam.scan")}</Alert>}
            <Typography variant="caption" color="text.secondary">
              {t("steam.logTitle")}
            </Typography>
            <Box
              component="pre"
              sx={{ m: 0, p: 1, maxHeight: 360, overflow: "auto", fontFamily: "monospace", fontSize: 10, lineHeight: 1, bgcolor: "action.hover" }}
            >
              {lines.join("\n")}
            </Box>
            <LinearProgress variant={percent === null ? "indeterminate" : "determinate"} value={percent ?? 0} />
          </Stack>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={pickFolder} disabled={depotRunning}>
          {t("steam.pick")}
        </Button>
        {issue?.depotAvailable && (
          <Button onClick={depotRunning ? cancelDepot : askDepot} color={depotRunning ? "error" : "primary"}>
            {depotRunning ? t("steam.cancelDepot") : t("steam.depot")}
          </Button>
        )}
        <Button onClick={onRetry} disabled={depotRunning}>
          {t("steam.retry")}
        </Button>
        <Button onClick={onClose} disabled={depotRunning}>
          {t("common.close")}
        </Button>
      </DialogActions>
      <Dialog open={info !== null} onClose={() => setInfo(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("steam.infoTitle")}</DialogTitle>
        <DialogContent dividers>
          {info && (
            <SimpleMarkdown
              source={[
                t("steam.info.what"),
                t("steam.info.source", { url: info.sourceUrl }),
                `## ${t("steam.info.title")}`,
                t("steam.info.step1", { version: info.version || t("steam.info.notConfigured"), dir: info.toolsDir }),
                t("steam.info.step2"),
                t("steam.info.step3", { dir: info.downloadDir }),
                t("steam.info.step4"),
                t("steam.info.cancel"),
              ].join("\n")}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfo(null)}>{t("common.cancel")}</Button>
          <Button onClick={acceptInfo} variant="contained">
            {t("steam.infoContinue")}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
