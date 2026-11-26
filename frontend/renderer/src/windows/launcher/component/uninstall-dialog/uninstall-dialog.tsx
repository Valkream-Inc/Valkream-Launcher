/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Désinstallation d'un jeu en trois temps : confirmation, progression (barre + fichiers supprimés / total),
 * résultat (notification + message). Partagé par les réglages du jeu et la liste des installations obsolètes.
 */

import { Box, LinearProgress, Typography } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Channel, UninstallProgress } from "@shared/types";

import { notify } from "@/src/utils/notify";
import { useAction } from "../../context/action.context";
import Popup from "../popup/popup";

export interface UninstallTarget {
  id: string;
  channel: Channel;
  /** Nom affiché dans les messages. */
  name: string;
  /** `deprecated` : installation que le launcher ne propose plus. */
  kind: "installed" | "deprecated";
}

interface Props {
  target: UninstallTarget | null;
  onClose: () => void;
  /** Appelé après une désinstallation réussie (relire les listes, le statut…). */
  onDone: () => void;
}

const percentOf = (progress: UninstallProgress | null): number | null =>
  progress && progress.total > 0 ? Math.floor((progress.done / progress.total) * 1000) / 10 : null;

export default function UninstallDialog({ target, onClose, onDone }: Props) {
  const { t } = useTranslation();
  const { setKeepAlive } = useAction();
  const [removing, setRemoving] = useState(false);
  const [progress, setProgress] = useState<UninstallProgress | null>(null);

  // La suppression continue même si le thème change ou si les réglages s'ouvrent
  useEffect(() => {
    setKeepAlive("uninstall", removing);
    return () => setKeepAlive("uninstall", false);
  }, [removing, setKeepAlive]);

  useEffect(() => {
    if (!removing) return;
    window.electron_API.onUninstallProgress(setProgress);
    return () => window.electron_API.removeUninstallProgressListeners();
  }, [removing]);

  const confirm = useCallback(async () => {
    if (!target || removing) return;
    setProgress(null);
    setRemoving(true);
    try {
      if (target.kind === "deprecated") await window.electron_API.uninstallDeprecated(target.id, target.channel);
      else await window.electron_API.uninstallInstance(target.id, target.channel);
      enqueueSnackbar(t("uninstall.done", { name: target.name }), { variant: "success" });
      notify(t("notify.doneTitle"), t("uninstall.done", { name: target.name }));
      onDone();
      onClose();
    } catch (error) {
      console.error(error);
      const notInstalled = error instanceof Error && error.message.includes("err.notInstalled");
      const message = t(notInstalled ? "uninstall.notInstalled" : "uninstall.failed", { name: target.name });
      enqueueSnackbar(message, { variant: "error" });
      notify(t("notify.errorTitle"), message);
      if (notInstalled) {
        onDone(); // la liste affichait une installation qui n'existe plus
        onClose();
      }
    } finally {
      setRemoving(false);
      setProgress(null);
    }
  }, [target, removing, t, onDone, onClose]);

  const percent = percentOf(progress);
  const name = target?.name ?? "";

  return (
    <Popup
      open={target !== null}
      onClose={() => !removing && onClose()}
      type="warning"
      title={removing ? t("uninstall.removingTitle") : t("uninstall.confirmTitle")}
      message={
        removing ? (
          <Box sx={{ width: "100%", minWidth: { sm: 280 } }}>
            <Typography sx={{ mb: 1.5, fontFamily: "inherit" }}>{t("uninstall.removingText", { name })}</Typography>
            <LinearProgress variant={percent === null ? "indeterminate" : "determinate"} value={percent ?? 0} />
            {percent !== null && progress && (
              <Typography variant="caption" sx={{ display: "block", mt: 0.5, textAlign: "right", fontFamily: "inherit" }}>
                {percent} % · {t("uninstall.removingCount", { done: progress.done, total: progress.total })}
              </Typography>
            )}
          </Box>
        ) : (
          t("uninstall.confirmText", { name })
        )
      }
      dismissible={!removing}
      buttons={[
        { text: t("uninstall.button"), action: () => void confirm(), variant: "main", disabled: removing },
        { text: t("common.cancel"), action: onClose, variant: "secondary", disabled: removing },
      ]}
    />
  );
}
