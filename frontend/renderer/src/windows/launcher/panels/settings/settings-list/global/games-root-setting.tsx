/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Dossier d'installation des jeux : modifiable. Les jeux déjà installés sont déplacés
 * (atomique : l'ancien emplacement reste valide tant que le déplacement n'est pas terminé).
 */

import { useEffect, useState } from "react";

import { Box, Button, LinearProgress, Typography } from "@mui/material";
import { enqueueSnackbar } from "notistack";

import { useGames } from "../../../../context/games.context";
import SettingsBox from "../../component/settings-box/settings-box";
import { useTranslation } from "react-i18next";

function GamesRootSetting() {
  const { t } = useTranslation();
  const { refreshChannel, gamesRootMove } = useGames();
  const [root, setRoot] = useState<{ path: string; isDefault: boolean } | null>(null);
  const [starting, setStarting] = useState(false);
  const moving = starting || gamesRootMove.active;
  const percent = gamesRootMove.total > 0 ? Math.floor((gamesRootMove.done / gamesRootMove.total) * 100) : 0;

  const load = async () => setRoot(await window.electron_API.getGamesRoot());
  useEffect(() => {
    void load();
  }, []);

  const run = async (action: () => Promise<string | null>) => {
    setStarting(true);
    try {
      const folder = await action();
      if (folder) {
        enqueueSnackbar(t("settings.gamesRoot.moved", { folder }), { variant: "success" });
        await load();
        await refreshChannel();
      }
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error);
      // Electron préfixe les erreurs IPC : on ne garde que le message utile
      const message = raw.replace(/^Error invoking remote method '[^']+': (\w*Error: )?/, "");
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setStarting(false);
    }
  };

  return (
    <SettingsBox warn={true} text={t("settings.gamesRoot.text")}>
      <span>{root ? root.path : "…"}</span>
      <Button disabled={moving} onClick={() => run(() => window.electron_API.changeGamesRoot())}>
        {moving ? t("settings.gamesRoot.moving") : t("settings.gamesRoot.change")}
      </Button>
      {root && !root.isDefault && (
        <Button disabled={moving} onClick={() => run(() => window.electron_API.resetGamesRoot())}>
          {t("settings.gamesRoot.reset")}
        </Button>
      )}
      {moving && (
        <Box sx={{ width: "100%" }}>
          <LinearProgress
            variant={gamesRootMove.total > 0 ? "determinate" : "indeterminate"}
            value={percent}
          />
          <Typography variant="caption">
            {t("settings.gamesRoot.progress", { percent, done: gamesRootMove.done, total: gamesRootMove.total })}
          </Typography>
        </Box>
      )}
    </SettingsBox>
  );
}

export default GamesRootSetting;
