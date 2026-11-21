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
} from "@mui/material";
import type { Channel, DepotInfo, InstanceId, SteamSourceIssue } from "@shared/types";

import SimpleMarkdown from "./simple-markdown";

interface Props {
  issue: SteamSourceIssue | null;
  instanceId: InstanceId;
  channel: Channel;
  onClose: () => void;
  /** Une source est prête : on relance l'installation. */
  onRetry: () => void;
}

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
  const [depotRunning, setDepotRunning] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [percent, setPercent] = useState<number | null>(null);
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
      setError(err instanceof Error ? err.message : String(err));
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
    setDepotRunning(true);
    window.electron_API.onDepotOutput((data) => {
      if (data.id !== instanceId || data.channel !== channel || !mounted.current) return;
      if (data.line !== undefined) setLines((previous) => [...previous, data.line as string].slice(-MAX_LINES));
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
      <DialogTitle>Le jeu n'est pas utilisable tel quel</DialogTitle>
      <DialogContent dividers>
        {issue && <SimpleMarkdown source={issue.guide} />}
        {depotRunning && (
          <Stack spacing={1} sx={{ mt: 2 }}>
            <Alert severity="info">
              Scannez le QR code avec l'application mobile Steam (Steam Guard → « Scanner un code QR »). Le launcher ne voit pas votre mot de passe.
            </Alert>
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
          Localiser l'installation
        </Button>
        {issue?.depotAvailable && (
          <Button onClick={depotRunning ? cancelDepot : askDepot} color={depotRunning ? "error" : "primary"}>
            {depotRunning ? "Annuler le téléchargement" : "Télécharger la bonne version (QR)"}
          </Button>
        )}
        <Button onClick={onRetry} disabled={depotRunning}>
          J'ai installé la bonne version : réessayer
        </Button>
        <Button onClick={onClose} disabled={depotRunning}>
          Fermer
        </Button>
      </DialogActions>
      <Dialog open={info !== null} onClose={() => setInfo(null)} maxWidth="sm" fullWidth>
        <DialogTitle>À savoir avant d'utiliser DepotDownloader</DialogTitle>
        <DialogContent dividers>
          {info && (
            <SimpleMarkdown
              source={[
                "**DepotDownloader** est un outil open source (licence GPL-2.0) qui télécharge une version précise d'un jeu depuis les serveurs de Steam.",
                `Code source : ${info.sourceUrl}`,
                "## Ce qui se passe",
                `1. Le launcher télécharge la version officielle **${info.version || "non configurée"}** de l'outil, vérifie son empreinte sha256 puis le range dans \`${info.toolsDir}\`. S'il est modifié, il est refusé.`,
                "2. Une fenêtre affiche un **QR code** : scannez-le avec l'application mobile Steam. Votre mot de passe et votre code Steam Guard ne passent jamais par le launcher.",
                `3. Le jeu est téléchargé dans \`${info.downloadDir}\`, puis chaque fichier est vérifié avant d'être copié dans l'instance. Ce dossier est ensuite supprimé.`,
                "4. Le jeu doit appartenir à votre compte Steam. Ne partagez jamais les fichiers téléchargés.",
                "Vous pouvez annuler à tout moment.",
              ].join("\n")}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfo(null)}>Annuler</Button>
          <Button onClick={acceptInfo} variant="contained">
            J'ai compris, continuer
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
