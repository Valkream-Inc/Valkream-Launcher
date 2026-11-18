/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Accueil générique d'une instance du nouveau système : état de l'installation,
 * installation / mise à jour avec progression, lancement et accès aux réglages.
 */

import { useEffect, useState } from "react";
import { Box, Button, Chip, LinearProgress, Typography } from "@mui/material";
import { enqueueSnackbar } from "notistack";

import type { Channel, InstanceSyncProgress } from "@shared/types";

import instancesRenderConfig from "../../../../instances/instances.config";
import { pickChannel } from "../../../../instances/instances.helpers";
import { usePanels } from "../../context/panels.context";
import { useInstanceReport } from "../settings/instance/use-instance-report";

export default function InstanceHome({ instanceId }: { instanceId: string }) {
  const { changePanel } = usePanels();
  const renderConfig = instancesRenderConfig.find((item) => item.id === instanceId);
  const [channel, setChannel] = useState<Channel>("stable");
  const { report, loading, error, reload } = useInstanceReport(instanceId, channel);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<InstanceSyncProgress | null>(null);

  // Canal : beta seulement si activée dans le launcher ET proposée par le remote.
  useEffect(() => {
    void (async () => {
      const [betaEnabled, instances] = await Promise.all([
        window.electron_API.getSettings("betaEnabled"),
        window.electron_API.getInstances(),
      ]);
      const summary = instances.find((item) => item.id === instanceId);
      setChannel(pickChannel(betaEnabled, summary?.channels ?? []));
    })().catch(console.error);
  }, [instanceId]);

  useEffect(() => {
    window.electron_API.onInstanceProgress(setProgress);
    return () => window.electron_API.removeInstanceProgressListeners();
  }, []);

  const works = report?.summary.works === true;

  const install = async () => {
    setBusy(true);
    setProgress(null);
    try {
      const result = await window.electron_API.syncInstance(instanceId, channel);
      if (result.failed.length > 0) {
        enqueueSnackbar(
          `Échec : ${result.failed.map((f) => `${f.name} (${f.error})`).join(", ")}`,
          { variant: "error" }
        );
      } else {
        enqueueSnackbar("Installation à jour !", { variant: "success" });
      }
    } catch (e) {
      enqueueSnackbar(e instanceof Error ? e.message : String(e), { variant: "error" });
    } finally {
      setBusy(false);
      setProgress(null);
      await reload();
    }
  };

  const play = async () => {
    try {
      await window.electron_API.launchInstance(instanceId, channel);
    } catch (e) {
      enqueueSnackbar(e instanceof Error ? e.message : String(e), { variant: "error" });
    }
  };

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        color: "#fff",
      }}
    >
      <Typography variant="h3">
        {renderConfig?.name ?? instanceId}
        {channel === "beta" && " (beta)"}
      </Typography>
      {renderConfig?.tipContent}
      {loading && !busy && <Typography>Chargement…</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      {report && report.errors.length > 0 && (
        <Typography color="error">{report.errors[0]}</Typography>
      )}
      {report && (
        <Chip
          color={works ? "success" : "warning"}
          label={
            works
              ? "Prêt à jouer"
              : `À installer ou mettre à jour : ${report.summary.blocking.join(", ") || "voir Debug"}`
          }
        />
      )}
      {busy && (
        <Box sx={{ width: 360 }}>
          <LinearProgress
            variant={progress && progress.total > 0 ? "determinate" : "indeterminate"}
            value={progress && progress.total > 0 ? ((progress.index - 1) / progress.total) * 100 : 0}
          />
          <Typography variant="caption">
            {progress?.message ?? "Préparation…"}
            {progress && progress.total > 0 && ` (${progress.index}/${progress.total})`}
          </Typography>
        </Box>
      )}
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button variant="contained" disabled={busy || !works} onClick={play}>
          Jouer
        </Button>
        <Button variant="contained" color="secondary" disabled={busy || loading} onClick={install}>
          {report && report.summary.total > 0 && report.summary.notInstalled === report.summary.total - report.summary.skipped
            ? "Installer"
            : "Mettre à jour"}
        </Button>
        <Button variant="outlined" disabled={busy} onClick={() => changePanel("settings")}>
          Réglages
        </Button>
        <Button variant="outlined" disabled={busy} onClick={() => changePanel("choose-games")}>
          Changer de jeu
        </Button>
      </Box>
    </Box>
  );
}
