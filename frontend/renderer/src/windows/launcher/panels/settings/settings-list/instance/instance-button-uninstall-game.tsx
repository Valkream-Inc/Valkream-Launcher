/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { Button } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import instancesRenderConfig from "../../../../../../instances/instances.config";
import { notify } from "@/src/utils/notify";
import UninstallDialog, { type UninstallTarget } from "../../../../component/uninstall-dialog/uninstall-dialog";
import { useAction } from "../../../../context/action.context";
import { useGames } from "../../../../context/games.context";
import SettingsBox from "../../component/settings-box/settings-box";
import type { InstanceButtonProps } from "./instance-setting.types";

const Instance_ButtonUninstallGame = ({
  id,
  channel,
  onDone = () => {},
}: InstanceButtonProps) => {
  const { t } = useTranslation();
  const { actionLoading } = useAction();
  const { refreshChannel } = useGames();
  const [target, setTarget] = useState<UninstallTarget | null>(null);
  const name = instancesRenderConfig.find((item) => item.id === id)?.name ?? id;

  const handleClick = async () => {
    try {
      // Un jeu qui n'est pas installé : message clair au lieu d'une « désinstallation » sans effet
      const status = await window.electron_API.getInstanceStatus(id, channel);
      if (!status?.isInstalled) {
        const message = t("uninstall.notInstalled", { name });
        enqueueSnackbar(message, { variant: "warning" });
        notify(t("notify.errorTitle"), message);
        return;
      }
    } catch (error) {
      console.error(error); // statut illisible : la confirmation est proposée quand même
    }
    setTarget({ id, channel, name, kind: "installed" });
  };

  return (
    <>
      <UninstallDialog
        target={target}
        onClose={() => setTarget(null)}
        onDone={() => {
          onDone();
          void refreshChannel(); // statut et infos relus tout de suite (bouton principal, liste des jeux)
        }}
      />
      <SettingsBox warn={false} text={t("instance.uninstall.text")}>
        <Button
          variant="contained"
          size="large"
          sx={{ fontSize: "1.2rem" }}
          color="error"
          disabled={actionLoading}
          onClick={() => void handleClick()}
        >
          {t("instance.uninstall.button")}
        </Button>
      </SettingsBox>
    </>
  );
};

export default Instance_ButtonUninstallGame;
