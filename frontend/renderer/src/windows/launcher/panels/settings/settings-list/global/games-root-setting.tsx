/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Dossier d'installation des jeux : modifiable. Les jeux déjà installés sont déplacés
 * (atomique : l'ancien emplacement reste valide tant que le déplacement n'est pas terminé).
 */

import { useEffect, useState } from "react";

import { Button } from "@mui/material";
import { enqueueSnackbar } from "notistack";

import { useGames } from "../../../../context/games.context";
import SettingsBox from "../../component/settings-box/settings-box";
import { useTranslation } from "react-i18next";

function GamesRootSetting() {
  const { t } = useTranslation();
  const { refreshChannel } = useGames();
  const [root, setRoot] = useState<{ path: string; isDefault: boolean } | null>(null);
  const [moving, setMoving] = useState(false);

  const load = async () => setRoot(await window.electron_API.getGamesRoot());
  useEffect(() => {
    void load();
  }, []);

  const run = async (action: () => Promise<string | null>) => {
    setMoving(true);
    try {
      const folder = await action();
      if (folder) {
        enqueueSnackbar(t("settings.gamesRoot.moved", { folder }), { variant: "success" });
        await load();
        await refreshChannel();
      }
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : String(error), { variant: "error" });
    } finally {
      setMoving(false);
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
    </SettingsBox>
  );
}

export default GamesRootSetting;
