/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import React, { useState } from "react";
import SettingsBox from "../component/settings-box/settings-box.jsx";
import { Button } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { useAction } from "../../../context/action.context.jsx";
import Wait from "../../../component/wait/wait.jsx";

const ButtonUninstallGame = () => {
  const { runAction } = useAction();
  const [isWaiting, setIsWaiting] = useState(false);

  const handleClick = () => {
    runAction(async () => {
      try {
        setIsWaiting(true);
        await window.electron_API.uninstallGame();
        enqueueSnackbar("Jeu désinstallé !", { variant: "success" });
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

export default ButtonUninstallGame;
