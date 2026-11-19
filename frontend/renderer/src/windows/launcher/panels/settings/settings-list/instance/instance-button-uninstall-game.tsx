/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { Button } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";
import Wait from "../../../../component/wait/wait";
import { useAction } from "../../../../context/action.context";
import SettingsBox from "../../component/settings-box/settings-box";
import type { InstanceButtonProps } from "./instance-setting.types";

const Instance_ButtonUninstallGame = ({
  id,
  channel,
  onDone = () => {},
}: InstanceButtonProps) => {
  const { runAction } = useAction();
  const [isWaiting, setIsWaiting] = useState(false);

  const handleClick = () => {
    runAction(async () => {
      try {
        setIsWaiting(true);
        await window.electron_API.uninstallInstance(id, channel);
        enqueueSnackbar("Jeu désinstallé !", { variant: "success" });
        onDone();
      } catch (error) {
        console.error(error);
        enqueueSnackbar("Jeu non désinstallé !", { variant: "error" });
      } finally {
        setIsWaiting(false);
      }
    }, "uninstallGame");
  };

  return (
    <>
      <Wait isVisible={isWaiting} />
      <SettingsBox
        warn={false}
        text="Vous pouvez supprimer les fichiers de jeux valkream."
      >
        <Button
          variant="contained"
          size="large"
          sx={{ fontSize: "1.2rem" }}
          color="error"
          onClick={handleClick}
        >
          Désinstaller le jeu
        </Button>
      </SettingsBox>
    </>
  );
};

export default Instance_ButtonUninstallGame;
