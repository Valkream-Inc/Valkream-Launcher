/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Accueil générique d'une instance du nouveau système : état de l'installation
 * (rapport du main) et accès aux réglages. L'installation / le lancement via le
 * moteur générique ne sont pas encore branchés : seul l'état est affiché.
 */

import { Box, Button, Chip, Typography } from "@mui/material";

import instancesRenderConfig from "../../../../instances/instances.config";
import { usePanels } from "../../context/panels.context";
import { useInstanceReport } from "../settings/instance/use-instance-report";

export default function InstanceHome({ instanceId }: { instanceId: string }) {
  const { changePanel } = usePanels();
  const renderConfig = instancesRenderConfig.find((item) => item.id === instanceId);
  const { report, loading, error } = useInstanceReport(instanceId, "stable");

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
      <Typography variant="h3">{renderConfig?.name ?? instanceId}</Typography>
      {renderConfig?.tipContent}
      {loading && <Typography>Chargement…</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      {report && (
        <Chip
          color={report.summary.works ? "success" : "warning"}
          label={
            report.summary.works
              ? "Installation à jour"
              : `À installer ou mettre à jour : ${report.summary.blocking.join(", ") || "voir Debug"}`
          }
        />
      )}
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button variant="contained" onClick={() => changePanel("settings")}>
          Réglages
        </Button>
        <Button variant="outlined" onClick={() => changePanel("choose-games")}>
          Changer de jeu
        </Button>
      </Box>
    </Box>
  );
}
